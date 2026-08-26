package forwarder

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"turnal.live/agent/pkg/protocol"
)

type Forwarder struct {
	targetHost string
	targetPort int
	client     *http.Client
	mu         sync.Mutex
	inFlight   map[string]*io.PipeWriter
}

func NewForwarder(host string, port int) *Forwarder {
	return &Forwarder{
		targetHost: host,
		targetPort: port,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		inFlight: make(map[string]*io.PipeWriter),
	}
}

func (f *Forwarder) HandleRequest(
	startMsg *protocol.HttpRequestStartMsg,
	sendFrame func(msg any),
) {
	startTime := time.Now()
	targetUrl := fmt.Sprintf("http://%s:%d%s", f.targetHost, f.targetPort, startMsg.Path)

	pipeReader, pipeWriter := io.Pipe()

	f.mu.Lock()
	f.inFlight[startMsg.RequestId] = pipeWriter
	f.mu.Unlock()

	go func() {
		defer func() {
			f.mu.Lock()
			delete(f.inFlight, startMsg.RequestId)
			f.mu.Unlock()
		}()

		req, err := http.NewRequest(startMsg.Method, targetUrl, pipeReader)
		if err != nil {
			sendFrame(&protocol.ErrorMsg{
				BaseMessage: protocol.BaseMessage{Type: protocol.ErrorMessage, Timestamp: time.Now().UnixMilli()},
				RequestId:   startMsg.RequestId,
				Code:        "INVALID_REQUEST",
				Message:     err.Error(),
			})
			return
		}

		for k, v := range startMsg.Headers {
			if strVal, ok := v.(string); ok {
				req.Header.Set(k, strVal)
			}
		}
		req.Header.Set("Host", fmt.Sprintf("%s:%d", f.targetHost, f.targetPort))

		resp, err := f.client.Do(req)
		if err != nil {
			sendFrame(&protocol.ErrorMsg{
				BaseMessage: protocol.BaseMessage{Type: protocol.ErrorMessage, Timestamp: time.Now().UnixMilli()},
				RequestId:   startMsg.RequestId,
				Code:        "LOCAL_CONNECTION_REFUSED",
				Message:     fmt.Sprintf("Failed to connect to local application at %s:%d: %s", f.targetHost, f.targetPort, err.Error()),
			})
			return
		}
		defer resp.Body.Close()

		resHeaders := make(map[string]any)
		for k, v := range resp.Header {
			if len(v) > 0 {
				resHeaders[k] = v[0]
			}
		}

		// 1. Send HTTP_RESPONSE_START
		sendFrame(&protocol.HttpResponseStartMsg{
			BaseMessage:   protocol.BaseMessage{Type: protocol.HttpResponseStart, Timestamp: time.Now().UnixMilli()},
			RequestId:     startMsg.RequestId,
			StatusCode:    resp.StatusCode,
			StatusMessage: resp.Status,
			Headers:       resHeaders,
		})

		// 2. Stream Body Chunks
		buf := make([]byte, 32*1024)
		var totalBytes int64
		for {
			n, err := resp.Body.Read(buf)
			if n > 0 {
				totalBytes += int64(n)
				encoded := base64.StdEncoding.EncodeToString(buf[:n])
				sendFrame(&protocol.HttpResponseChunkMsg{
					BaseMessage: protocol.BaseMessage{Type: protocol.HttpResponseChunk, Timestamp: time.Now().UnixMilli()},
					RequestId:   startMsg.RequestId,
					Chunk:       encoded,
					IsBinary:    true,
				})
			}
			if err != nil {
				break
			}
		}

		// 3. Send HTTP_RESPONSE_END
		sendFrame(&protocol.HttpResponseEndMsg{
			BaseMessage: protocol.BaseMessage{Type: protocol.HttpResponseEnd, Timestamp: time.Now().UnixMilli()},
			RequestId:   startMsg.RequestId,
			DurationMs:  time.Since(startTime).Milliseconds(),
			BytesSent:   totalBytes,
		})
	}()
}

func (f *Forwarder) WriteChunk(requestId, base64Chunk string) {
	f.mu.Lock()
	pw, exists := f.inFlight[requestId]
	f.mu.Unlock()

	if exists && pw != nil {
		data, err := base64.StdEncoding.DecodeString(base64Chunk)
		if err == nil {
			pw.Write(data)
		}
	}
}

func (f *Forwarder) CloseRequest(requestId string) {
	f.mu.Lock()
	pw, exists := f.inFlight[requestId]
	f.mu.Unlock()

	if exists && pw != nil {
		pw.Close()
	}
}
