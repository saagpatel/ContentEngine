use serde::{Deserialize, Serialize};

/// Error codes for structured error responses
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    // Content errors
    ContentTooShort,
    ContentTooLong,
    InvalidUrl,
    FetchTimeout,
    NotFound,

    // API errors
    InvalidKey,
    ApiRateLimited,
    ApiError,
    UsageLimitExceeded,

    // Voice errors
    InvalidSamples,
    InvalidVoice,

    // DB/System errors
    DbError,
    KeyringError,
    ExportError,

    // Network errors
    NetworkError,
    ValidationError,
}

/// Structured error response for frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub success: bool,
    pub error: ErrorDetail,
}

/// Error details with code, message, and optional metadata
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorDetail {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry_after: Option<u32>,
}

impl ErrorResponse {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            success: false,
            error: ErrorDetail {
                code,
                message: message.into(),
                details: None,
                retry_after: None,
            },
        }
    }

    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.error.details = Some(details);
        self
    }

    pub fn with_retry_after(mut self, seconds: u32) -> Self {
        self.error.retry_after = Some(seconds);
        self
    }
}
