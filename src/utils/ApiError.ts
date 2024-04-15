class ApiError extends Error {
    statusCode: number;
    message: string;
    errors: any[];
    data: any;
    success: boolean;
    constructor(
        statusCode: number,
        message = "Something went wrong",
        errors = [],
    )
    {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
    }
}

export {ApiError}