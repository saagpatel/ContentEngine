use rusqlite::params;
use tauri::AppHandle;
use tauri::Manager;

use crate::db::DbState;
use crate::errors::AppError;
use crate::models::brand_voice::StyleAttributes;
use crate::models::content::{RepurposeRequest, RepurposeResponse, RepurposedOutput};
use crate::services::claude_api::ClaudeApiClient;
use crate::services::usage_tracker;

fn persist_successful_repurpose(
    conn: &mut rusqlite::Connection,
    request: &RepurposeRequest,
    results: &[(crate::models::platform::OutputFormat, String)],
) -> Result<RepurposeResponse, AppError> {
    if results.is_empty() {
        return Err(AppError::ClaudeApi(
            "Claude returned no outputs".to_string(),
        ));
    }

    let tx = conn.transaction()?;

    let content_input_id = uuid::Uuid::new_v4().to_string();
    let word_count = request.content.split_whitespace().count() as u32;
    let created_at = chrono::Utc::now().to_rfc3339();

    tx.execute(
        "INSERT INTO content_inputs (id, source_url, raw_text, title, word_count, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            content_input_id,
            request.source_url,
            request.content,
            request.title,
            word_count,
            created_at
        ],
    )?;

    let mut outputs = Vec::new();
    for (format, text) in results {
        let output_id = uuid::Uuid::new_v4().to_string();
        let output_created_at = chrono::Utc::now().to_rfc3339();
        let format_str = format.to_string();

        tx.execute(
            "INSERT INTO repurposed_outputs (id, content_input_id, format, output_text, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                output_id,
                content_input_id,
                format_str,
                text,
                output_created_at
            ],
        )?;

        outputs.push(RepurposedOutput {
            id: output_id,
            content_input_id: content_input_id.clone(),
            format: format_str,
            output_text: text.clone(),
            created_at: output_created_at,
        });
    }

    let usage_id = uuid::Uuid::new_v4().to_string();
    tx.execute(
        "INSERT INTO usage_records (id, content_input_id, format_count) VALUES (?1, ?2, ?3)",
        params![usage_id, content_input_id, results.len() as u32],
    )?;

    tx.commit()?;

    Ok(RepurposeResponse {
        content_input_id,
        outputs,
    })
}

#[tauri::command]
pub async fn repurpose_content(
    app: AppHandle,
    request: RepurposeRequest,
) -> Result<RepurposeResponse, AppError> {
    if request.content.trim().is_empty() {
        return Err(AppError::Validation("Content cannot be empty".to_string()));
    }

    if request.formats.is_empty() {
        return Err(AppError::Validation(
            "At least one output format must be selected".to_string(),
        ));
    }

    let db = app.state::<DbState>();

    // Check usage limit
    usage_tracker::check_usage_limit(&db).await?;

    // Get API key
    let api_key = usage_tracker::get_api_key(&db).await?;

    // Load brand voice if specified
    let voice: Option<StyleAttributes> = if let Some(ref voice_id) = request.voice_id {
        let conn = db.conn.lock().await;
        let style_json: String = conn
            .query_row(
                "SELECT style_attributes_json FROM brand_voice_profiles WHERE id = ?1",
                params![voice_id],
                |row| row.get(0),
            )
            .map_err(|_| AppError::NotFound(format!("Brand voice profile '{}' not found", voice_id)))?;
        let style: StyleAttributes = serde_json::from_str(&style_json)?;
        Some(style)
    } else {
        // Check for default voice
        let conn = db.conn.lock().await;
        let result: Result<String, _> = conn.query_row(
            "SELECT style_attributes_json FROM brand_voice_profiles WHERE is_default = 1",
            [],
            |row| row.get(0),
        );
        match result {
            Ok(style_json) => {
                let style: StyleAttributes = serde_json::from_str(&style_json)?;
                Some(style)
            }
            Err(_) => None,
        }
    };

    let config = request.config.clone().unwrap_or_default();

    // Call Claude API
    let claude = app.state::<ClaudeApiClient>();
    let results = claude
        .repurpose(
            &api_key,
            &request.content,
            &request.formats,
            &request.tone,
            &request.length,
            voice.as_ref(),
            &config,
        )
        .await?;

    let mut conn = db.conn.lock().await;
    persist_successful_repurpose(&mut conn, &request, &results)
}

#[cfg(test)]
mod tests {
    use super::persist_successful_repurpose;
    use crate::db;
    use crate::models::content::RepurposeRequest;
    use crate::models::platform::{LengthPreset, OutputFormat, PlatformConfig, TonePreset};

    fn setup_connection() -> rusqlite::Connection {
        let conn = rusqlite::Connection::open_in_memory().expect("open in-memory db");
        db::run_migrations(&conn).expect("run migrations");
        conn
    }

    fn sample_request() -> RepurposeRequest {
        RepurposeRequest {
            content: "This is source content with enough words to create a meaningful record."
                .to_string(),
            source_url: Some("https://example.com/post".to_string()),
            title: Some("Example".to_string()),
            formats: vec![OutputFormat::Summary, OutputFormat::Linkedin],
            tone: TonePreset::Professional,
            length: LengthPreset::Medium,
            voice_id: None,
            config: Some(PlatformConfig::default()),
        }
    }

    fn sample_results() -> Vec<(OutputFormat, String)> {
        vec![
            (OutputFormat::Summary, "Summary output".to_string()),
            (OutputFormat::Linkedin, "LinkedIn output".to_string()),
        ]
    }

    #[test]
    fn persists_content_outputs_and_usage_for_successful_generation() {
        let mut conn = setup_connection();

        let response = persist_successful_repurpose(&mut conn, &sample_request(), &sample_results())
            .expect("persist successful generation");

        assert_eq!(response.outputs.len(), 2);

        let content_count: u32 = conn
            .query_row("SELECT COUNT(*) FROM content_inputs", [], |row| row.get(0))
            .expect("count content inputs");
        let output_count: u32 = conn
            .query_row("SELECT COUNT(*) FROM repurposed_outputs", [], |row| row.get(0))
            .expect("count outputs");
        let usage_total: u32 = conn
            .query_row(
                "SELECT COALESCE(SUM(format_count), 0) FROM usage_records",
                [],
                |row| row.get(0),
            )
            .expect("count usage");

        assert_eq!(content_count, 1);
        assert_eq!(output_count, 2);
        assert_eq!(usage_total, 2);
    }

    #[test]
    fn rejects_empty_results_without_creating_history_records() {
        let mut conn = setup_connection();

        let error = persist_successful_repurpose(&mut conn, &sample_request(), &[])
            .expect_err("empty results should fail");

        assert!(
            error.to_string().contains("Claude returned no outputs"),
            "empty generations should raise a clear error"
        );

        let content_count: u32 = conn
            .query_row("SELECT COUNT(*) FROM content_inputs", [], |row| row.get(0))
            .expect("count content inputs");
        let output_count: u32 = conn
            .query_row("SELECT COUNT(*) FROM repurposed_outputs", [], |row| row.get(0))
            .expect("count outputs");

        assert_eq!(content_count, 0);
        assert_eq!(output_count, 0);
    }

    #[test]
    fn rolls_back_partial_records_when_usage_persistence_fails() {
        let mut conn = setup_connection();
        conn.execute("DROP TABLE usage_records", [])
            .expect("drop usage_records");

        let error = persist_successful_repurpose(&mut conn, &sample_request(), &sample_results())
            .expect_err("usage insert failure should bubble up");

        assert!(
            error.to_string().contains("no such table: usage_records"),
            "failing writes should report the underlying database issue"
        );

        let content_count: u32 = conn
            .query_row("SELECT COUNT(*) FROM content_inputs", [], |row| row.get(0))
            .expect("count content inputs");
        let output_count: u32 = conn
            .query_row("SELECT COUNT(*) FROM repurposed_outputs", [], |row| row.get(0))
            .expect("count outputs");

        assert_eq!(content_count, 0);
        assert_eq!(output_count, 0);
    }
}
