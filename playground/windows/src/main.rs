
fn main() -> Result<(), Box<dyn std::error::Error>> {
    levelo_windows::run_engine("LeveloJS Playground App", 1200, 800)?;
    Ok(())
}