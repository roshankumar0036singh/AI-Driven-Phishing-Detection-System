import base64
import os

icons = {
    "icon16.png": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAGElEQVQoz2NgQAN/gP///wMxFAQECAB9BgDzU0gYVwAAAABJRU5ErkJggg==",
    "icon48.png": "iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAQAAABnztUvAAAAGElEQVR42mP8/5+hP6b98CAwMDAxAAAu8GBS1L7qkQAAAABJRU5ErkJggg==",
    "icon128.png": "iVBORw0KGgoAAAANSUhEUgAAAIwAAACMCAYAAACp3+n8AAAAGElEQVR42u3BMQEAAAgDoJvcf9CwMR4AAABgSURBVO3BQkOEAAAwdoP//4ZQgglIABAAcQ4CwAAAABJRU5ErkJggg=="
}

os.makedirs("icons", exist_ok=True)

for filename, b64data in icons.items():
    with open(os.path.join("icons", filename), "wb") as f:
        f.write(base64.b64decode(b64data))

print("Icons created in ./icons/")
