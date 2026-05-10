with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add Dialog import
content = content.replace(
    'import { useState } from "react";',
    'import { useState } from "react";\nimport { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";'
)

# Replace results section with modal
old = """      {/* Results */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="bg-card border border-border/50 p-8 rounded-sm text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Compatibility Score</p>
            <div className="text-8xl font-heading font-bold mb-3" style={{ color: result.verdict.color }}>
              {result.overall}%
            </div>
            <p className="font-medium" style={{ color: result.verdict.color }}>{result.verdict.text}</p>
            <p className="text-xs text-muted-foreground mt-2">Target: {result.division}</p>
          </div>

          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <h3 className="font-heading font-bold uppercase mb-5 text-sm tracking-wide">Score Breakdown</h3>
            <ScoreBar score={result.scores.academic} label="Academic Eligibility" />
            <ScoreBar score={result.scores.english} label="English Proficiency" />
            <ScoreBar score={result.scores.athletic} label="Athletic Level" />
            <ScoreBar score={result.scores.eligibility} label="Eligibility Window" />
            <ScoreBar score={result.scores.budget} label="Financial Readiness" />
          </div>

          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <h3 className="font-heading font-bold uppercase mb-4 text-sm tracking-wide">Kato Insights</h3>
            <div className="space-y-2">
              {result.insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-lg leading-none">
                    {ins.s === "good" ? "✅" : ins.s === "warning" ? "⚠️" : "❌"}
                  </span>
                  <span className={ins.s === "good" ? "text-green-400" : ins.s === "warning" ? "text-yellow-400" : "text-red-400"}>
                    {ins.t}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-5 rounded-sm text-center">
            <p className="text-sm text-muted-foreground">
              {result.overall >= 60
                ? "Ready to take the next step? Browse opportunities that match your profile."
                : "Work on the highlighted areas then run Kato again to track your progress."}
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              ⚠️ Kato provides guidance only — always verify eligibility with an NCAA/NAIA Eligibility Center advisor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};"""

new = """      {/* Results Modal */}
      {result && (
        <Dialog open={!!result} onOpenChange={() => setResult(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase text-center">Kato Analysis — {result.division}</DialogTitle>
            </DialogHeader>

            {/* Overall Score */}
            <div className="text-center py-4 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Compatibility Score</p>
              <div className="text-7xl font-heading font-bold mb-2" style={{ color: result.verdict.color }}>
                {result.overall}%
              </div>
              <p className="font-medium text-sm" style={{ color: result.verdict.color }}>{result.verdict.text}</p>
            </div>

            {/* Score Breakdown */}
            <div className="py-4 border-b border-border">
              <h3 className="font-heading font-bold uppercase mb-4 text-xs tracking-wide text-muted-foreground">Score Breakdown</h3>
              <ScoreBar score={result.scores.academic} label="Academic Eligibility" />
              <ScoreBar score={result.scores.english} label="English Proficiency" />
              <ScoreBar score={result.scores.athletic} label="Athletic Level" />
              <ScoreBar score={result.scores.eligibility} label="Eligibility Window" />
              <ScoreBar score={result.scores.budget} label="Financial Readiness" />
            </div>

            {/* Insights */}
            <div className="py-4">
              <h3 className="font-heading font-bold uppercase mb-3 text-xs tracking-wide text-muted-foreground">Kato Insights</h3>
              <div className="space-y-2">
                {result.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 leading-none">
                      {ins.s === "good" ? "✅" : ins.s === "warning" ? "⚠️" : "❌"}
                    </span>
                    <span className={ins.s === "good" ? "text-green-400" : ins.s === "warning" ? "text-yellow-400" : "text-red-400"}>
                      {ins.t}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic text-center pb-2">
              ⚠️ Kato provides guidance only — always verify with an NCAA/NAIA Eligibility Center advisor.
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")