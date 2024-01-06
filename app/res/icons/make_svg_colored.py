""" Small utility to fill the svgs with different colors fast """
import os
import re

# Get files in current dir
all_files = os.listdir()

# Extract the svgs
svg_files = [(i, file[:-4]) for (i, file) in enumerate(all_files) if file[-3:] == "svg"]
print(svg_files)

# Allow user to input colors for each file
colors = []
for i in range(len(svg_files)):
    color = input("Color for '%s' button: " % svg_files[i][1])
    colors.append(color)

# Open each svg and fill it with the appropriate color
for i, svg_file in enumerate(svg_files):

    # Skip colors left blank
    if colors[i] == "":
        continue
    
    with open(all_files[svg_file[0]], "r") as in_file:
        svg_content = in_file.read()

    # Replace fill colors with the given color
    svg_content = re.sub('fill: #.+"', 'fill: %s"' % (colors[i]), svg_content)

    # Save changes
    with open(all_files[svg_file[0]], "w") as out_file:
        out_file.write(svg_content)
