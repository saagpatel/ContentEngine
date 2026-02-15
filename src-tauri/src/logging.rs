use std::fs;
use std::path::Path;
use tracing_subscriber::fmt::format::FmtSpan;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

/// Initialize structured logging with file output
///
/// Logs are written to: {app_data_dir}/logs/contentengine-{date}.log
/// Logs rotate daily and are structured for easy parsing
pub fn init_logging(app_data_dir: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let log_dir = app_data_dir.join("logs");
    fs::create_dir_all(&log_dir)?;

    // Create daily rotating file appender
    let file_appender = tracing_appender::rolling::daily(&log_dir, "contentengine.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    // Build subscriber with both stdout and file output
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .with_writer(non_blocking)
                .with_span_events(FmtSpan::CLOSE)
                .with_target(true)
                .with_level(true)
                .with_thread_ids(true)
                .with_ansi(false) // Disable ANSI codes in log files
                .json()
        )
        .with(
            tracing_subscriber::fmt::layer()
                .with_writer(std::io::stdout)
                .with_span_events(FmtSpan::NONE)
                .with_target(false)
                .compact()
        )
        .with(tracing_subscriber::EnvFilter::from_default_env()
            .add_directive(tracing::Level::INFO.into()))
        .init();

    tracing::info!(
        log_dir = %log_dir.display(),
        "Logging initialized"
    );

    Ok(())
}

/// Log span for operations
#[macro_export]
macro_rules! log_operation {
    ($name:expr) => {
        tracing::info_span!($name)
    };
    ($name:expr, $($field:tt)*) => {
        tracing::info_span!($name, $($field)*)
    };
}
