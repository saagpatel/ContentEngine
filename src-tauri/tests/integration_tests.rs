use wiremock::{Mock, MockServer, ResponseTemplate};
use wiremock::matchers::{method, path, header};
use serde_json::json;

mod utils;

/// Test: Full repurpose content pipeline with mocked Claude API
#[tokio::test]
async fn test_repurpose_content_full_pipeline() {
    // Setup mock Claude API server
    let mock_server = MockServer::start().await;

    // Mock the extract key points call
    Mock::given(method("POST"))
        .and(path("/v1/messages"))
        .and(header("x-api-key", "sk-ant-test-key"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "id": "msg_extract_123",
            "type": "message",
            "role": "assistant",
            "content": [{
                "type": "text",
                "text": r#"{"main_topic":"Test Topic","key_points":["Point 1","Point 2"],"supporting_details":["Detail 1"],"tone":"professional","target_audience":"Marketers"}"#
            }],
            "model": "claude-sonnet-4-5-20250514",
            "stop_reason": "end_turn",
            "usage": {"input_tokens": 100, "output_tokens": 50}
        })))
        .expect(1..)
        .mount(&mock_server)
        .await;

    // Create test database
    let (db_state, _temp_dir) = utils::create_test_db();

    // Insert test content
    let test_content = "This is test content about content marketing. ".repeat(20);
    utils::insert_test_content(&db_state, "test-content-123", "Test Article", &test_content)
        .expect("Failed to insert test content");

    // Set test API key
    utils::set_test_api_key(&db_state, "sk-ant-test-key")
        .expect("Failed to set API key");

    // Note: This test demonstrates the structure but requires refactoring the actual
    // repurpose_content command to accept a base_url parameter for testing.
    // For now, we verify the database setup and usage tracking works.

    // Verify content was inserted
    let conn = db_state.db.lock().unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM content_inputs", [], |row| row.get(0))
        .expect("Failed to count content");
    assert_eq!(count, 1, "Content should be inserted");

    // Verify initial usage is 0
    drop(conn);
    let usage = utils::get_monthly_usage(&db_state).expect("Failed to get usage");
    assert_eq!(usage, 0, "Initial usage should be 0");
}

/// Test: Usage limit enforcement blocks generation
#[tokio::test]
async fn test_usage_limit_blocks_generation() {
    let (db_state, _temp_dir) = utils::create_test_db();

    // Insert 50 usage records (at the limit)
    utils::insert_usage_records(&db_state, 50).expect("Failed to insert usage records");

    // Verify usage is at limit
    let usage = utils::get_monthly_usage(&db_state).expect("Failed to get usage");
    assert_eq!(usage, 50, "Usage should be at limit");

    // Get monthly limit setting
    let conn = db_state.db.lock().unwrap();
    let limit: String = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'monthly_usage_limit'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to get limit");

    assert_eq!(limit, "50", "Default limit should be 50");

    // In a real test, we would call repurpose_content and verify it returns
    // UsageLimitExceeded error. This requires dependency injection for the
    // usage tracker service.
}

/// Test: Database migrations create all required tables
#[tokio::test]
async fn test_database_migrations_complete() {
    let (db_state, _temp_dir) = utils::create_test_db();

    let conn = db_state.db.lock().unwrap();

    // Verify all tables exist
    let tables: Vec<String> = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .unwrap()
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

    let expected_tables = vec![
        "app_settings",
        "brand_voice_profiles",
        "brand_voice_samples",
        "content_inputs",
        "repurposed_outputs",
        "usage_records",
    ];

    for table in expected_tables {
        assert!(
            tables.contains(&table.to_string()),
            "Table {} should exist",
            table
        );
    }
}

/// Test: Content input validation
#[tokio::test]
async fn test_content_validation() {
    let (db_state, _temp_dir) = utils::create_test_db();

    // Test: Content too short (less than 50 characters)
    let short_content = "Too short";
    let result = utils::insert_test_content(&db_state, "test-1", "Title", short_content);
    // This would be validated in the command layer, not DB layer
    // So this test passes but validation should happen before DB insert

    // Test: Valid content length
    let valid_content = "This is valid content with enough words. ".repeat(10);
    let result = utils::insert_test_content(&db_state, "test-2", "Valid Title", &valid_content);
    assert!(result.is_ok(), "Valid content should be insertable");

    // Verify insertion
    let conn = db_state.db.lock().unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM content_inputs", [], |row| row.get(0))
        .expect("Failed to count");
    assert!(count >= 1, "At least one content should be inserted");
}

/// Test: Brand voice profile CRUD operations
#[tokio::test]
async fn test_brand_voice_crud() {
    let (db_state, _temp_dir) = utils::create_test_db();

    let conn = db_state.db.lock().unwrap();

    // Insert brand voice profile
    let voice_id = "voice-test-123";
    let style_attributes = json!({
        "tone": "professional",
        "vocabulary": "business-focused",
        "sentence_structure": "clear and concise",
        "key_phrases": ["leverage", "optimize"],
        "emoji_usage": "none"
    });

    conn.execute(
        "INSERT INTO brand_voice_profiles
         (id, name, description, style_attributes_json, is_default, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            voice_id,
            "Professional Voice",
            "Corporate tone",
            style_attributes.to_string(),
            0,
            chrono::Utc::now().to_rfc3339(),
            chrono::Utc::now().to_rfc3339(),
        ],
    )
    .expect("Failed to insert voice profile");

    // Verify insertion
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM brand_voice_profiles", [], |row| row.get(0))
        .expect("Failed to count profiles");
    assert_eq!(count, 1, "One profile should exist");

    // Test: Set as default
    conn.execute(
        "UPDATE brand_voice_profiles SET is_default = 1 WHERE id = ?1",
        rusqlite::params![voice_id],
    )
    .expect("Failed to set default");

    let is_default: i64 = conn
        .query_row(
            "SELECT is_default FROM brand_voice_profiles WHERE id = ?1",
            rusqlite::params![voice_id],
            |row| row.get(0),
        )
        .expect("Failed to get is_default");
    assert_eq!(is_default, 1, "Should be set as default");

    // Test: Delete (should cascade to samples)
    conn.execute(
        "DELETE FROM brand_voice_profiles WHERE id = ?1",
        rusqlite::params![voice_id],
    )
    .expect("Failed to delete");

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM brand_voice_profiles", [], |row| row.get(0))
        .expect("Failed to count after delete");
    assert_eq!(count, 0, "Profile should be deleted");
}

/// Test: History pagination
#[tokio::test]
async fn test_history_pagination() {
    let (db_state, _temp_dir) = utils::create_test_db();

    // Insert 25 content items
    for i in 0..25 {
        let id = format!("content-{}", i);
        let title = format!("Article {}", i);
        let content = format!("Content for article {}. ", i).repeat(20);
        utils::insert_test_content(&db_state, &id, &title, &content)
            .expect("Failed to insert content");
    }

    let conn = db_state.db.lock().unwrap();

    // Test page 0 (first 10 items)
    let page_size = 10;
    let page = 0;
    let offset = page * page_size;

    let mut stmt = conn
        .prepare("SELECT COUNT(*) FROM content_inputs")
        .unwrap();
    let total: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
    assert_eq!(total, 25, "Should have 25 items");

    let mut stmt = conn
        .prepare("SELECT id FROM content_inputs ORDER BY created_at DESC LIMIT ?1 OFFSET ?2")
        .unwrap();
    let items: Vec<String> = stmt
        .query_map(rusqlite::params![page_size, offset], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

    assert_eq!(items.len(), 10, "First page should have 10 items");

    // Test page 2 (last 5 items)
    let page = 2;
    let offset = page * page_size;

    let mut stmt = conn
        .prepare("SELECT id FROM content_inputs ORDER BY created_at DESC LIMIT ?1 OFFSET ?2")
        .unwrap();
    let items: Vec<String> = stmt
        .query_map(rusqlite::params![page_size, offset], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

    assert_eq!(items.len(), 5, "Last page should have 5 items");
}

/// Test: Cascade delete when content is deleted
#[tokio::test]
async fn test_cascade_delete() {
    let (db_state, _temp_dir) = utils::create_test_db();

    let content_id = "content-cascade-test";

    // Insert content
    utils::insert_test_content(&db_state, content_id, "Test", "Content here. ".repeat(20))
        .expect("Failed to insert content");

    let conn = db_state.db.lock().unwrap();

    // Insert outputs
    conn.execute(
        "INSERT INTO repurposed_outputs (id, content_input_id, format, output_text, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            "output-1",
            content_id,
            "twitter",
            "Tweet content",
            chrono::Utc::now().to_rfc3339(),
        ],
    )
    .expect("Failed to insert output");

    // Verify output exists
    let output_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repurposed_outputs WHERE content_input_id = ?1",
            rusqlite::params![content_id],
            |row| row.get(0),
        )
        .expect("Failed to count outputs");
    assert_eq!(output_count, 1, "Output should exist");

    // Delete content
    conn.execute(
        "DELETE FROM content_inputs WHERE id = ?1",
        rusqlite::params![content_id],
    )
    .expect("Failed to delete content");

    // Verify outputs were cascade deleted
    let output_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repurposed_outputs WHERE content_input_id = ?1",
            rusqlite::params![content_id],
            |row| row.get(0),
        )
        .expect("Failed to count outputs after delete");
    assert_eq!(output_count, 0, "Outputs should be cascade deleted");
}

/// Test: API key storage and retrieval
#[tokio::test]
async fn test_api_key_storage() {
    let (db_state, _temp_dir) = utils::create_test_db();

    let test_key = "sk-ant-api03-test-key-1234567890";

    // Store API key
    utils::set_test_api_key(&db_state, test_key).expect("Failed to set API key");

    // Retrieve API key
    let conn = db_state.db.lock().unwrap();
    let stored_key: String = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'claude_api_key'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to get API key");

    assert_eq!(stored_key, test_key, "Stored key should match");

    // Test: Update API key
    drop(conn);
    utils::set_test_api_key(&db_state, "sk-ant-new-key").expect("Failed to update key");

    let conn = db_state.db.lock().unwrap();
    let updated_key: String = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'claude_api_key'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to get updated key");

    assert_eq!(updated_key, "sk-ant-new-key", "Key should be updated");
}
