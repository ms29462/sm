with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "r", encoding="utf-8") as f:
    content = f.read()

# Move validation to case 3
content = content.replace(
    """      case 2:
        if (form.highlight_video) {
          const ytPattern = /^(https?:\\/\\/)?(www\\.)?(youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)[a-zA-Z0-9_-]+/;
          const vimeoPattern = /^(https?:\\/\\/)?(www\\.)?vimeo\\.com\\/[0-9]+/;
          if (!ytPattern.test(form.highlight_video) && !vimeoPattern.test(form.highlight_video)) {
            toast.error("Please enter a valid YouTube or Vimeo link for your highlight video");
            return false;
          }
        }""",
    "      case 2:"
)

# Add validation to case 3 instead
content = content.replace(
    "      case 3:\n",
    """      case 3:
        if (form.highlight_video) {
          const ytPattern = /^(https?:\\/\\/)?(www\\.)?(youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)[a-zA-Z0-9_-]+/;
          const vimeoPattern = /^(https?:\\/\\/)?(www\\.)?vimeo\\.com\\/[0-9]+/;
          if (!ytPattern.test(form.highlight_video) && !vimeoPattern.test(form.highlight_video)) {
            toast.error("Please enter a valid YouTube or Vimeo link for your highlight video");
            return false;
          }
        }
"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")