package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"turnal.live/agent/pkg/client"
	"turnal.live/agent/pkg/config"
)

var (
	port         int
	subdomain    string
	customDomain string
	name         string
	host         string
	edgeWsUrl    string
	apiUrl       string
	apiKey       string
)

var rootCmd = &cobra.Command{
	Use:   "turnal",
	Short: "Turnal - Independent Local-to-Public Tunnel Platform Agent",
}

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Authenticate with your Turnal account",
	Run: func(cmd *cobra.Command, args []string) {
		if apiKey != "" {
			config.SaveConfig(&config.Config{ApiKey: apiKey, ApiUrl: apiUrl})
			fmt.Println("✔ Successfully authenticated with API Key!")
			return
		}

		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Email: ")
		email, _ := reader.ReadString('\n')
		fmt.Print("Password: ")
		pass, _ := reader.ReadString('\n')

		payload, _ := json.Marshal(map[string]string{
			"email":    strings.TrimSpace(email),
			"password": strings.TrimSpace(pass),
		})

		resp, err := http.Post(fmt.Sprintf("%s/api/auth/login", apiUrl), "application/json", bytes.NewBuffer(payload))
		if err != nil {
			fmt.Printf("✖ Error contacting API: %v\n", err)
			return
		}
		defer resp.Body.Close()

		var result struct {
			Success bool `json:"success"`
			Data    struct {
				Token string `json:"token"`
				User  struct {
					Email string `json:"email"`
					Name  string `json:"name"`
				} `json:"user"`
			} `json:"data"`
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}

		json.NewDecoder(resp.Body).Decode(&result)
		if !result.Success {
			fmt.Printf("✖ Login failed: %s\n", result.Error.Message)
			return
		}

		config.SaveConfig(&config.Config{
			Token:     result.Data.Token,
			UserEmail: result.Data.User.Email,
			UserName:  result.Data.User.Name,
			ApiUrl:    apiUrl,
		})

		fmt.Printf("✔ Welcome back, %s! Credentials saved.\n", result.Data.User.Name)
	},
}

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check agent authentication status",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, _ := config.LoadConfig()
		if cfg.Token == "" && cfg.ApiKey == "" {
			fmt.Println("Not logged in. Run: turnal login")
			return
		}
		fmt.Println("\nTurnal Agent Status:")
		fmt.Printf("  User:   %s\n", cfg.UserName)
		fmt.Printf("  Email:  %s\n", cfg.UserEmail)
		fmt.Printf("  Config: %s\n\n", config.GetConfigPath())
	},
}

var tunnelCmd = &cobra.Command{
	Use:   "tunnel",
	Short: "Expose a local port to the internet",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, _ := config.LoadConfig()
		if cfg.Token == "" && cfg.ApiKey == "" {
			fmt.Println("✖ Authentication required. Please run: turnal login")
			return
		}

		fmt.Println("\n  ████████╗██╗   ██╗██████╗ ███╗   ██╗ █████╗ ██╗     ")
		fmt.Println("  ╚══██╔══╝██║   ██║██╔══██╗████╗  ██║██╔══██╗██║     ")
		fmt.Println("     ██║   ██║   ██║██████╔╝██╔██╗ ██║███████║██║     ")
		fmt.Println("     ██║   ██║   ██║██╔══██╗██║╚██╗██║██╔══██║██║     ")
		fmt.Println("     ██║   ╚██████╔╝██║  ██║██║ ╚████║██║  ██║███████╗")
		fmt.Println("     ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝\n")

		c := client.NewTunnelClient(client.ClientOptions{
			EdgeWsUrl:    edgeWsUrl,
			Token:        cfg.Token,
			ApiKey:       cfg.ApiKey,
			LocalPort:    port,
			LocalHost:    host,
			Subdomain:    subdomain,
			CustomDomain: customDomain,
			ProjectName:  name,
		})

		if err := c.Start(); err != nil {
			fmt.Printf("Tunnel exited with error: %v\n", err)
		}
	},
}

func init() {
	loginCmd.Flags().StringVar(&apiUrl, "api-url", "http://localhost:4000", "Turnal API URL")
	loginCmd.Flags().StringVar(&apiKey, "api-key", "", "Direct API key authentication")

	tunnelCmd.Flags().IntVarP(&port, "port", "p", 3000, "Local target port (e.g. 3000)")
	tunnelCmd.Flags().StringVarP(&subdomain, "subdomain", "s", "", "Custom requested subdomain")
	tunnelCmd.Flags().StringVarP(&customDomain, "domain", "d", "", "Custom verified domain")
	tunnelCmd.Flags().StringVarP(&name, "name", "n", "", "Project name")
	tunnelCmd.Flags().StringVar(&host, "host", "localhost", "Local target host")
	tunnelCmd.Flags().StringVar(&edgeWsUrl, "edge-ws", "ws://127.0.0.1:8080/tunnel/connect", "Edge WebSocket endpoint")

	rootCmd.AddCommand(loginCmd)
	rootCmd.AddCommand(statusCmd)
	rootCmd.AddCommand(tunnelCmd)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
