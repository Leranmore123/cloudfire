package client

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/signal"
	"runtime"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"turnal.live/agent/pkg/forwarder"
	"turnal.live/agent/pkg/protocol"
)

type ClientOptions struct {
	EdgeWsUrl       string
	Token           string
	ApiKey          string
	LocalPort       int
	LocalHost       string
	Subdomain       string
	CustomDomain    string
	ProjectName     string
}

type TunnelClient struct {
	opts      ClientOptions
	forwarder *forwarder.Forwarder
	conn      *websocket.Conn
	mu        sync.Mutex
	stopCh    chan struct{}
}

func NewTunnelClient(opts ClientOptions) *TunnelClient {
	if opts.LocalHost == "" {
		opts.LocalHost = "localhost"
	}
	return &TunnelClient{
		opts:      opts,
		forwarder: forwarder.NewForwarder(opts.LocalHost, opts.LocalPort),
		stopCh:    make(chan struct{}),
	}
}

func (c *TunnelClient) Start() error {
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	for {
		select {
		case <-c.stopCh:
			return nil
		case <-interrupt:
			fmt.Println("\nGracefully shutting down tunnel...")
			c.Close()
			return nil
		default:
			err := c.connectAndRun()
			if err != nil {
				log.Printf("Connection error: %v. Reconnecting in 3s...", err)
				time.Sleep(3 * time.Second)
			}
		}
	}
}

func (c *TunnelClient) Close() {
	close(c.stopCh)
	c.mu.Lock()
	if c.conn != nil {
		c.conn.Close()
	}
	c.mu.Unlock()
}

func (c *TunnelClient) send(msg any) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn != nil {
		c.conn.WriteJSON(msg)
	}
}

func (c *TunnelClient) connectAndRun() error {
	u, err := url.Parse(c.opts.EdgeWsUrl)
	if err != nil {
		return err
	}

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	c.mu.Lock()
	c.conn = conn
	c.mu.Unlock()

	hostname, _ := os.Hostname()

	// 1. Send AUTH_REQ
	c.send(&protocol.AuthReqMsg{
		BaseMessage:  protocol.BaseMessage{Type: protocol.AuthReq, Timestamp: time.Now().UnixMilli()},
		Token:        c.opts.Token,
		ApiKey:       c.opts.ApiKey,
		AgentVersion: "1.0.0",
		Platform:     runtime.GOOS,
		DeviceName:   hostname,
	})

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			return err
		}

		var base protocol.BaseMessage
		if err := json.Unmarshal(message, &base); err != nil {
			continue
		}

		switch base.Type {
		case protocol.AuthAck:
			// After auth, register tunnel
			c.send(&protocol.TunnelRegisterReqMsg{
				BaseMessage:     protocol.BaseMessage{Type: protocol.TunnelRegisterReq, Timestamp: time.Now().UnixMilli()},
				ProjectName:     c.opts.ProjectName,
				Subdomain:       c.opts.Subdomain,
				CustomDomain:    c.opts.CustomDomain,
				LocalTargetPort: c.opts.LocalPort,
				LocalTargetHost: c.opts.LocalHost,
				Protocol:        "http",
			})

		case protocol.AuthFail:
			return fmt.Errorf("authentication failed")

		case protocol.TunnelRegisterAck:
			var ack protocol.TunnelRegisterAckMsg
			json.Unmarshal(message, &ack)
			fmt.Println("\n=======================================================")
			fmt.Println("  TUNNEL IS ONLINE!")
			fmt.Printf("  Forwarding: %s -> http://%s:%d\n", ack.PublicUrl, c.opts.LocalHost, c.opts.LocalPort)
			if ack.CustomDomain != "" {
				fmt.Printf("  Custom Dom: http://%s\n", ack.CustomDomain)
			}
			fmt.Printf("  Tunnel ID:  %s\n", ack.TunnelId)
			fmt.Println("=======================================================\n")

		case protocol.HttpRequestStart:
			var start protocol.HttpRequestStartMsg
			json.Unmarshal(message, &start)
			fmt.Printf("  [%s] %s %s\n", time.Now().Format("15:04:05"), start.Method, start.Path)
			c.forwarder.HandleRequest(&start, c.send)

		case protocol.HttpRequestChunk:
			var chunk protocol.HttpRequestChunkMsg
			json.Unmarshal(message, &chunk)
			c.forwarder.WriteChunk(chunk.RequestId, chunk.Chunk)

		case protocol.HttpRequestEnd:
			var end protocol.HttpRequestEndMsg
			json.Unmarshal(message, &end)
			c.forwarder.CloseRequest(end.RequestId)

		case protocol.HeartbeatPing:
			var ping protocol.HeartbeatPingMsg
			json.Unmarshal(message, &ping)
			c.send(&protocol.HeartbeatPongMsg{
				BaseMessage: protocol.BaseMessage{Type: protocol.HeartbeatPong, Timestamp: time.Now().UnixMilli()},
				Sequence:    ping.Sequence,
			})
		}
	}
}
