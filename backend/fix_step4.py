with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "      case 3:\n        if (form.highlight_video) {\n          const ytPattern = /^(https?:\\/\\/)?(www\\.)?(youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)[a-zA-Z0-9_-]+/;\n          const vimeoPattern = /^(https?:\\/\\/)?(www\\.)?vimeo\\.com\\/[0-9]+/;\n          if (!ytPattern.test(form.highlight_video) && !vimeoPattern.test(form.highlight_video)) {\n            toast.error(\"Please enter a valid YouTube or Vimeo link for your highlight video\");\n            return false;\n          }\n        }\n",
    "      case 3:\n"
)

content = content.replace(
    "      case 4:\n",
    """      case 4:
        if (form.highlight_video) {
          const ytPattern = /(youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)[a-zA-Z0-9_-]+/;
          const vimeoPattern = /vimeo\\.com\\/[0-9]+/;
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