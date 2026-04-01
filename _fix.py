# -*- coding: utf-8 -*-
path = 'e:/SPRING 2026/CAPSTONE/KidzgoCentre/components/gamification/staff-gamification-workspace.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

before = content.count('theme=" staff\')
print(f'Before: {before}')

# Fix MetricCard without theme
content = content.replace('icon={<Star className=\h-5 w-5\ />} />\n </div>', 'icon={<Star className=\h-5 w-5\ />} theme=\staff\ />\n </div>')
content = content.replace('icon={<Trophy className=\h-5 w-5\ />} label=\Cap\ hint=', 'icon={<Trophy className=\h-5 w-5\ />} label=\Cap\ hint=')
content = content.replace('icon={<Trophy className=\h-5 w-5\ />} label=\C\ap" hint= icon={<Trophy className="h-5 w-5" />} label="C" ap\ hint=')

after = content.count('theme=\staff\')
print(f'After: {after}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
