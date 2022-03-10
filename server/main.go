package main

import (
	"fmt"
	"net/http"
)

func hello(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintln(w, "Hello World")
}

func main() {
	http.HandleFunc("/hello", hello)

	http.ListenAndServe(":8080", nil)
}
