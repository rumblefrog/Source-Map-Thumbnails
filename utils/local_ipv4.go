package utils

import (
	"net"
	"os"
)

func GetFirstLocalIPv4() string {
	host, _ := os.Hostname()

	addrs, _ := net.LookupIP(host)

	for _, addr := range addrs {
		if ipv4 := addr.To4(); ipv4 != nil {
			return ipv4.String()
		}
	}

	return ""
}
