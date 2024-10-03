package tools

func Assert(condition bool, message string) {
	if !condition {
		panic(message)
	}
}
