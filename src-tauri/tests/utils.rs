use rusqlite::Connection;
use std::sync::Mutex;
use tempfile::TempDir;
use content_engine_lib::db::DbState;

/// Create an in-memory test database with migrations applied
pub fn create_test_db() -> (DbState, TempDir) {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let db_path = temp_dir.path().join("test.db");

    let conn = Connection::open(&db_path).expect("Failed to open test DB");

    // Run migrations
    content_engine_lib::db::run_migrations(&conn).expect("Failed to run migrations");

    let db_state = DbState {
        db: Mutex::new(conn),
    };

    (db_state, temp_dir)
}

/// Insert test content into database
pub fn insert_test_content(db: &DbState, id: &str, title: &str, raw_text: &str) -> Result<(), String> {
    let conn = db.db.lock().unwrap();

    conn.execute(
        "INSERT INTO content_inputs (id, title, raw_text, word_count, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            id,
            title,
            raw_text,
            raw_text.split_whitespace().count(),
            chrono::Utc::now().to_rfc3339(),
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Insert usage records to test monthly limits
pub fn insert_usage_records(db: &DbState, count: usize) -> Result<(), String> {
    let conn = db.db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    for i in 0..count {
        conn.execute(
            "INSERT INTO usage_records (id, content_input_id, format_count, created_at)
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![
                format!("usage-{}", i),
                format!("content-{}", i),
                1,
                &now,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Get usage count for current month
pub fn get_monthly_usage(db: &DbState) -> Result<usize, String> {
    let conn = db.db.lock().unwrap();

    let now = chrono::Utc::now();
    let month_start = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap();
    let month_start_str = chrono::DateTime::<chrono::Utc>::from_utc(month_start, chrono::Utc).to_rfc3339();

    let count: usize = conn
        .query_row(
            "SELECT COALESCE(SUM(format_count), 0) FROM usage_records WHERE created_at >= ?1",
            rusqlite::params![month_start_str],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(count)
}

/// Set API key in settings
pub fn set_test_api_key(db: &DbState, api_key: &str) -> Result<(), String> {
    let conn = db.db.lock().unwrap();

    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('claude_api_key', ?1)",
        rusqlite::params![api_key],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
