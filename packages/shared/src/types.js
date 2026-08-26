"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SslStatus = exports.DomainVerificationStatus = exports.TunnelStatus = void 0;
var TunnelStatus;
(function (TunnelStatus) {
    TunnelStatus["OFFLINE"] = "OFFLINE";
    TunnelStatus["ONLINE"] = "ONLINE";
    TunnelStatus["CONNECTING"] = "CONNECTING";
    TunnelStatus["ERROR"] = "ERROR";
    TunnelStatus["DISABLED"] = "DISABLED";
})(TunnelStatus || (exports.TunnelStatus = TunnelStatus = {}));
var DomainVerificationStatus;
(function (DomainVerificationStatus) {
    DomainVerificationStatus["PENDING"] = "PENDING";
    DomainVerificationStatus["VERIFIED"] = "VERIFIED";
    DomainVerificationStatus["FAILED"] = "FAILED";
})(DomainVerificationStatus || (exports.DomainVerificationStatus = DomainVerificationStatus = {}));
var SslStatus;
(function (SslStatus) {
    SslStatus["NONE"] = "NONE";
    SslStatus["PENDING"] = "PENDING";
    SslStatus["ACTIVE"] = "ACTIVE";
    SslStatus["ERROR"] = "ERROR";
})(SslStatus || (exports.SslStatus = SslStatus = {}));
//# sourceMappingURL=types.js.map