class ApiResponse {
    constructor(statusCode = 200, data, message = "Success") {
        this.statusCode = statusCode
        this.message = message
        this.data = data
    }
}

export { ApiResponse }