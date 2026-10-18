// agy-gemini launcher (2026-10-17)
//
// Why this exists: Paperclip runs .cmd files through cmd.exe, and cmd.exe cuts a
// multi-line prompt apart at the line breaks ("unexpected argument AGENTS.md:").
// An .exe is spawned directly, so the prompt arrives intact.
// This launcher only runs:  node agy-gemini-shim.mjs <same args>
//
// Build (no install needed, compiler ships with Windows):
//   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /out:agy-gemini.exe agy-gemini-launcher.cs
using System;
using System.Diagnostics;
using System.IO;
using System.Text;

static class AgyGeminiLauncher
{
    // Quote one argument per the Windows CommandLineToArgvW rules.
    static string Quote(string arg)
    {
        if (arg.Length > 0 && arg.IndexOfAny(new[] { ' ', '\t', '\n', '\r', '\v', '"' }) < 0) return arg;
        var sb = new StringBuilder("\"");
        int backslashes = 0;
        foreach (char c in arg)
        {
            if (c == '\\') { backslashes++; continue; }
            if (c == '"') { sb.Append('\\', backslashes * 2 + 1); sb.Append('"'); }
            else { sb.Append('\\', backslashes); sb.Append(c); }
            backslashes = 0;
        }
        sb.Append('\\', backslashes * 2);
        sb.Append('"');
        return sb.ToString();
    }

    static string FindNode()
    {
        string fromEnv = Environment.GetEnvironmentVariable("AGY_GEMINI_NODE");
        if (!string.IsNullOrEmpty(fromEnv) && File.Exists(fromEnv)) return fromEnv;
        string pf = Environment.GetEnvironmentVariable("ProgramFiles") ?? @"C:\Program Files";
        string std = Path.Combine(pf, "nodejs", "node.exe");
        if (File.Exists(std)) return std;
        foreach (string dir in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(';'))
        {
            try { string p = Path.Combine(dir.Trim(), "node.exe"); if (File.Exists(p)) return p; } catch { }
        }
        return "node.exe";
    }

    static int Main(string[] args)
    {
        string here = AppDomain.CurrentDomain.BaseDirectory;
        string shim = Path.Combine(here, "agy-gemini-shim.mjs");
        var line = new StringBuilder(Quote(shim));
        foreach (string a in args) { line.Append(' '); line.Append(Quote(a)); }

        var psi = new ProcessStartInfo(FindNode(), line.ToString())
        {
            UseShellExecute = false,   // inherit stdin/stdout/stderr
            CreateNoWindow = true,
        };
        try
        {
            using (var p = Process.Start(psi))
            {
                p.WaitForExit();
                return p.ExitCode;
            }
        }
        catch (Exception e)
        {
            Console.Error.WriteLine("agy-gemini launcher: cannot start node: " + e.Message);
            return 127;
        }
    }
}
