with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileHeader.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add LogOut button in header next to hamburger
old = """          {showMenu && (
            <button onClick={() => setMenuOpen(true)} className="p-2 -mr-2 text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          )}"""

new = """          <div className="flex items-center gap-1">
            {showMenu && (
              <button onClick={() => setMenuOpen(true)} className="p-2 text-foreground">
                <Menu className="w-6 h-6" />
              </button>
            )}
            <button onClick={handleLogout} className="p-2 -mr-2 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileHeader.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")