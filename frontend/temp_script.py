import os

file_path = "src/App.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We look for the gradient string exactly
old_str = '            backgroundImage:\n              "radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 50%, rgba(200, 20, 255, 0.08) 0%, transparent 50%)",'

if old_str in content:
    content = content.replace(old_str, "")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Not found fallback!")
