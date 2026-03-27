import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execPromise = promisify(exec)

export async function POST(req: Request) {
  try {
    // Determine the path to the python script
    const scriptPath = path.join(process.cwd(), "scripts", "prospector.py")
    
    // Parse the query and source if provided
    const body = await req.json().catch(() => ({}))
    const query = body.query || "Boutiques Nassau"
    const source = body.source || "google"

    // Execute the python script using the project-local venv if it exists, otherwise use system python3
    const venvPath = path.join(process.cwd(), "venv", "bin", "python3")
    const pythonPath = fs.existsSync(venvPath) ? venvPath : "python3"
    
    const { stdout, stderr } = await execPromise(`"${pythonPath}" "${scriptPath}" --run --query "${query}" --source "${source}"`)

    if (stderr) {
      console.error("Scraper Error:", stderr)
      return NextResponse.json({ success: false, error: stderr }, { status: 500 })
    }

    console.log("Scraper Output:", stdout)
    return NextResponse.json({ 
      success: true, 
      message: "Lead scraper completed successfully",
      output: stdout 
    })

  } catch (error) {
    console.error("Scraper Route Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}
