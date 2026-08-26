package protocol

type MessageType string

const (
	AuthReq           MessageType = "AUTH_REQ"
	AuthAck           MessageType = "AUTH_ACK"
	AuthFail          MessageType = "AUTH_FAIL"
	TunnelRegisterReq MessageType = "TUNNEL_REGISTER_REQ"
	TunnelRegisterAck MessageType = "TUNNEL_REGISTER_ACK"
	TunnelRegisterFail MessageType = "TUNNEL_REGISTER_FAIL"
	HttpRequestStart  MessageType = "HTTP_REQUEST_START"
	HttpRequestChunk  MessageType = "HTTP_REQUEST_CHUNK"
	HttpRequestEnd    MessageType = "HTTP_REQUEST_END"
	HttpResponseStart MessageType = "HTTP_RESPONSE_START"
	HttpResponseChunk MessageType = "HTTP_RESPONSE_CHUNK"
	HttpResponseEnd   MessageType = "HTTP_RESPONSE_END"
	HeartbeatPing     MessageType = "HEARTBEAT_PING"
	HeartbeatPong     MessageType = "HEARTBEAT_PONG"
	ErrorMessage      MessageType = "ERROR"
)

type BaseMessage struct {
	Type      MessageType `json:"type"`
	Timestamp int64       `json:"timestamp"`
}

type AuthReqMsg struct {
	BaseMessage
	Token        string `json:"token,omitempty"`
	ApiKey       string `json:"apiKey,omitempty"`
	DeviceId     string `json:"deviceId,omitempty"`
	DeviceName   string `json:"deviceName,omitempty"`
	AgentVersion string `json:"agentVersion"`
	Platform     string `json:"platform"`
}

type AuthAckMsg struct {
	BaseMessage
	UserId    string `json:"userId"`
	UserEmail string `json:"userEmail"`
	SessionId string `json:"sessionId"`
}

type TunnelRegisterReqMsg struct {
	BaseMessage
	ProjectName     string `json:"projectName,omitempty"`
	Subdomain       string `json:"subdomain,omitempty"`
	CustomDomain    string `json:"customDomain,omitempty"`
	LocalTargetPort int    `json:"localTargetPort"`
	LocalTargetHost string `json:"localTargetHost"`
	Protocol        string `json:"protocol"`
}

type TunnelRegisterAckMsg struct {
	BaseMessage
	TunnelId          string   `json:"tunnelId"`
	Subdomain         string   `json:"subdomain"`
	PublicUrl         string   `json:"publicUrl"`
	CustomDomain      string   `json:"customDomain,omitempty"`
	AssignedHostnames []string `json:"assignedHostnames"`
	LocalTarget       string   `json:"localTarget"`
}

type HttpRequestStartMsg struct {
	BaseMessage
	RequestId string              `json:"requestId"`
	Method    string              `json:"method"`
	Url       string              `json:"url"`
	Path      string              `json:"path"`
	Headers   map[string]any      `json:"headers"`
	ClientIp  string              `json:"clientIp"`
	IsTls     bool                `json:"isTls"`
}

type HttpRequestChunkMsg struct {
	BaseMessage
	RequestId string `json:"requestId"`
	Chunk     string `json:"chunk"`
	IsBinary  bool   `json:"isBinary"`
}

type HttpRequestEndMsg struct {
	BaseMessage
	RequestId string `json:"requestId"`
}

type HttpResponseStartMsg struct {
	BaseMessage
	RequestId     string              `json:"requestId"`
	StatusCode    int                 `json:"statusCode"`
	StatusMessage string              `json:"statusMessage,omitempty"`
	Headers       map[string]any      `json:"headers"`
}

type HttpResponseChunkMsg struct {
	BaseMessage
	RequestId string `json:"requestId"`
	Chunk     string `json:"chunk"`
	IsBinary  bool   `json:"isBinary"`
}

type HttpResponseEndMsg struct {
	BaseMessage
	RequestId  string `json:"requestId"`
	DurationMs int64  `json:"durationMs"`
	BytesSent  int64  `json:"bytesSent"`
}

type HeartbeatPingMsg struct {
	BaseMessage
	Sequence int64 `json:"sequence"`
}

type HeartbeatPongMsg struct {
	BaseMessage
	Sequence int64 `json:"sequence"`
}

type ErrorMsg struct {
	BaseMessage
	RequestId string `json:"requestId,omitempty"`
	Code      string `json:"code"`
	Message   string `json:"message"`
}
