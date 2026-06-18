with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")