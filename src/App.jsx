import { useEffect, useMemo, useRef, useState } from 'react';

const initialBlocks = [
  { id: 'b1', title: 'On Start', category: 'Events', color: '#7c3aed' },
  { id: 'b2', title: 'Move Forward', category: 'Motion', color: '#2563eb' },
  { id: 'b3', title: 'Play Sound', category: 'Audio', color: '#f59e0b' },
  { id: 'b4', title: 'If Touch', category: 'Logic', color: '#10b981' },
];

const initialSprites = [
  { id: 's1', name: 'Hero', x: 160, y: 180, size: 74, color: '#a78bfa', label: 'H' },
  { id: 's2', name: 'Coin', x: 330, y: 120, size: 42, color: '#fbbf24', label: 'C' },
  { id: 's3', name: 'Platform', x: 240, y: 300, size: 110, color: '#34d399', label: 'P' },
];

const defaultScript = `// Infinite Studio Pro runtime example
const hero = sprite('Hero');
const coin = sprite('Coin');

hero.move(10, 0);
if (hero.touches(coin)) {
  coin.hide();
  playSound('coin');
}
`;

const defaultProject = {
  name: 'Infinite Dream',
  width: 960,
  height: 560,
};

function App() {
  const [projectName, setProjectName] = useState(defaultProject.name);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [sprites, setSprites] = useState(initialSprites);
  const [selectedSpriteId, setSelectedSpriteId] = useState('s1');
  const [jsCode, setJsCode] = useState(defaultScript);
  const [is3D, setIs3D] = useState(false);
  const [ambienceOn, setAmbienceOn] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Ready to build');
  const stageRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('infinite-studio-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.sprites) setSprites(parsed.sprites);
        if (parsed.jsCode) setJsCode(parsed.jsCode);
        if (parsed.blocks) setBlocks(parsed.blocks);
      } catch (error) {
        console.warn('Could not restore saved project', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'infinite-studio-state',
      JSON.stringify({ projectName, sprites, jsCode, blocks })
    );
  }, [projectName, sprites, jsCode, blocks]);

  const selectedSprite = useMemo(
    () => sprites.find((sprite) => sprite.id === selectedSpriteId) ?? sprites[0],
    [sprites, selectedSpriteId]
  );

  const addBlock = (category) => {
    const colorMap = {
      Events: '#7c3aed',
      Motion: '#2563eb',
      Audio: '#f59e0b',
      Logic: '#10b981',
      Graphics: '#ec4899',
    };

    const newBlock = {
      id: `b-${Date.now()}`,
      title: `${category} Block`,
      category,
      color: colorMap[category] ?? '#38bdf8',
    };

    setBlocks((current) => [...current, newBlock]);
    setStatus(`Added a ${category.toLowerCase()} block`);
  };

  const addSprite = () => {
    const newSprite = {
      id: `s-${Date.now()}`,
      name: `Sprite ${sprites.length + 1}`,
      x: 100 + sprites.length * 40,
      y: 120 + sprites.length * 30,
      size: 52,
      color: ['#60a5fa', '#f9a8d4', '#fcd34d', '#86efac'][sprites.length % 4],
      label: String.fromCharCode(65 + (sprites.length % 26)),
    };

    setSprites((current) => [...current, newSprite]);
    setSelectedSpriteId(newSprite.id);
    setStatus('Added a new sprite');
  };

  const onSpriteUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newSprite = {
        id: `s-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'Custom Sprite',
        x: 180,
        y: 160,
        size: 72,
        color: '#f472b6',
        label: 'C',
        image: reader.result,
      };
      setSprites((current) => [...current, newSprite]);
      setSelectedSpriteId(newSprite.id);
      setStatus(`Imported ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const updateSelectedSprite = (changes) => {
    if (!selectedSprite) return;
    setSprites((current) =>
      current.map((sprite) =>
        sprite.id === selectedSprite.id ? { ...sprite, ...changes } : sprite
      )
    );
  };

  const startAmbience = async () => {
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      setAmbienceOn(true);
      setStatus('Ambience started');
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      setStatus('Audio API unavailable in this browser');
      return;
    }

    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = 0.04;
    master.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 174;
    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.value = 220;

    const gainA = ctx.createGain();
    gainA.gain.value = 0.03;
    const gainB = ctx.createGain();
    gainB.gain.value = 0.025;

    oscA.connect(gainA);
    gainA.connect(master);
    oscB.connect(gainB);
    gainB.connect(master);

    oscA.start();
    oscB.start();

    audioCtxRef.current = ctx;
    window.__ambience = { oscA, oscB, gainA, gainB, master };
    setAmbienceOn(true);
    setStatus('Ambience started');
  };

  const stopAmbience = () => {
    if (window.__ambience) {
      const { oscA, oscB, gainA, gainB } = window.__ambience;
      oscA.stop();
      oscB.stop();
      gainA.disconnect();
      gainB.disconnect();
      delete window.__ambience;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setAmbienceOn(false);
    setStatus('Ambience stopped');
  };

  const toggleAmbience = () => {
    if (ambienceOn) {
      stopAmbience();
      return;
    }
    startAmbience();
  };

  const runProject = () => {
    setIsRunning(true);
    setStatus('Project running');

    setTimeout(() => {
      setIsRunning(false);
      setStatus('Project finished');
    }, 1200);
  };

  const handleStagePointerMove = (event) => {
    if (!selectedSprite) return;

    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const newX = Math.min(Math.max(event.clientX - bounds.left - selectedSprite.size / 2, 0), 760);
    const newY = Math.min(Math.max(event.clientY - bounds.top - selectedSprite.size / 2, 0), 420);

    updateSelectedSprite({ x: newX, y: newY });
  };

  const exportFile = (name, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${projectName}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0b1020; color: white; }
      #stage { position: relative; width: 960px; height: 560px; margin: 20px auto; border: 2px solid #4f46e5; border-radius: 16px; background: linear-gradient(180deg, #111827, #0b1120); }
      .sprite { position: absolute; border-radius: 50%; display: grid; place-items: center; color: white; font-weight: 700; }
    </style>
  </head>
  <body>
    <div id="stage">
      ${sprites
        .map(
          (sprite) =>
            `<div class="sprite" style="left:${sprite.x}px; top:${sprite.y}px; width:${sprite.size}px; height:${sprite.size}px; background:${sprite.color};">${sprite.label}</div>`
        )
        .join('')}
    </div>
    <script>
      const project = ${JSON.stringify({ projectName, sprites, jsCode }, null, 2)};
      console.log('Launch project:', project.projectName);
      // Runtime stub for exported HTML project.
    </script>
  </body>
</html>`;

    exportFile(`${projectName.replace(/\s+/g, '-').toLowerCase()}.html`, html, 'text/html');
    setStatus('Exported HTML build');
  };

  const exportHta = () => {
    const hta = `<!DOCTYPE html>
<html>
  <hta:application
    id="InfiniteStudioPro"
    applicationname="Infinite Studio Pro"
    border="thin"
    caption="yes"
    contextmenu="no"
    maximizebutton="yes"
    minimizebutton="yes"
    scroll="no"
    showintaskbar="yes"
    singleinstance="yes"
  />
  <head>
    <meta charset="UTF-8" />
    <title>${projectName}</title>
    <style>
      body { background: #0b1020; color: #dbeafe; font-family: Segoe UI, sans-serif; padding: 18px; }
      .panel { max-width: 900px; margin: 0 auto; }
      .stage { width: 100%; height: 420px; border-radius: 16px; border: 2px solid #4f46e5; background: linear-gradient(180deg, #111827, #0b1120); position: relative; }
      .sprite { position: absolute; border-radius: 50%; display: grid; place-items: center; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>${projectName}</h1>
      <div class="stage">
        ${sprites
          .map(
            (sprite) =>
              `<div class="sprite" style="left:${sprite.x}px; top:${sprite.y}px; width:${sprite.size}px; height:${sprite.size}px; background:${sprite.color};">${sprite.label}</div>`
          )
          .join('')}
      </div>
    </div>
  </body>
</html>`;

    exportFile(`${projectName.replace(/\s+/g, '-').toLowerCase()}.hta`, hta, 'text/html');
    setStatus('Exported HTA package');
  };

  const exportApk = () => {
    const apkProject = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.infiniteengine.${projectName.replace(/\s+/g, '').toLowerCase()}">
    <application
        android:label="${projectName}"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        <activity android:name=".MainActivity" />
    </application>
</manifest>

# Android package generation stub for ${projectName}
# This scaffold can be used with Android Studio or Capacitor to produce a real APK.
# It is a starter export package for the project.
`;

    exportFile(`${projectName.replace(/\s+/g, '-').toLowerCase()}.apk`, apkProject, 'application/octet-stream');
    setStatus('Prepared APK package scaffold');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="branding-block">
          <div className="logo">∞</div>
          <div>
            <p className="eyebrow">Game Design Engine</p>
            <h1>Infinite Studio Pro</h1>
          </div>
        </div>

        <div className="top-actions">
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="title-input"
          />
          <button className="primary" onClick={runProject}>
            {isRunning ? 'Running…' : 'Run Project'}
          </button>
          <button className="secondary" onClick={() => setIs3D((val) => !val)}>
            {is3D ? 'Exit 3D' : '3D Mode'}
          </button>
          <button className="secondary" onClick={toggleAmbience}>
            {ambienceOn ? 'Mute Ambience' : 'Ambience'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel left-panel">
          <div className="panel-header">
            <h2>Blocks</h2>
          </div>
          <div className="block-list">
            {blocks.map((block) => (
              <button
                key={block.id}
                className="block-chip"
                style={{ background: `${block.color}22`, borderColor: `${block.color}` }}
                onClick={() => addBlock(block.category)}
              >
                <span className="dot" style={{ background: block.color }} />
                {block.title}
              </button>
            ))}
          </div>

          <div className="panel-header compact">
            <h2>Palette</h2>
          </div>
          <div className="palette-grid">
            {['Events', 'Motion', 'Audio', 'Logic', 'Graphics'].map((category) => (
              <button key={category} className="palette-button" onClick={() => addBlock(category)}>
                {category}
              </button>
            ))}
          </div>
        </aside>

        <section className="center-panel">
          <div className={`stage-wrapper ${is3D ? 'is-3d' : ''}`}>
            <div
              ref={stageRef}
              className="stage"
              onPointerMove={handleStagePointerMove}
              onPointerLeave={() => setStatus('Scene ready')}
            >
              {sprites.map((sprite) => (
                <div
                  key={sprite.id}
                  className={`sprite ${selectedSpriteId === sprite.id ? 'selected' : ''}`}
                  style={{
                    left: sprite.x,
                    top: sprite.y,
                    width: sprite.size,
                    height: sprite.size,
                    background: sprite.color,
                    backgroundImage: sprite.image ? `url(${sprite.image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  onPointerDown={() => setSelectedSpriteId(sprite.id)}
                >
                  {!sprite.image && <span>{sprite.label}</span>}
                </div>
              ))}
            </div>

            <div className="stage-toolbar">
              <button onClick={addSprite}>+ Add Sprite</button>
              <label className="upload-button">
                Import Sprite
                <input type="file" accept="image/*" onChange={onSpriteUpload} />
              </label>
            </div>
          </div>

          <div className="code-panel">
            <div className="panel-header">
              <h2>JavaScript</h2>
            </div>
            <textarea value={jsCode} onChange={(event) => setJsCode(event.target.value)} />
          </div>
        </section>

        <aside className="panel right-panel">
          <div className="panel-header">
            <h2>Inspector</h2>
          </div>

          {selectedSprite && (
            <div className="inspector-card">
              <label>
                <span>Name</span>
                <input
                  value={selectedSprite.name}
                  onChange={(event) => updateSelectedSprite({ name: event.target.value })}
                />
              </label>
              <label>
                <span>Size</span>
                <input
                  type="range"
                  min="32"
                  max="140"
                  value={selectedSprite.size}
                  onChange={(event) => updateSelectedSprite({ size: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>X Position</span>
                <input
                  type="number"
                  value={selectedSprite.x}
                  onChange={(event) => updateSelectedSprite({ x: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>Y Position</span>
                <input
                  type="number"
                  value={selectedSprite.y}
                  onChange={(event) => updateSelectedSprite({ y: Number(event.target.value) })}
                />
              </label>
            </div>
          )}

          <div className="export-actions">
            <h3>Exports</h3>
            <button onClick={exportHtml}>Export .HTML</button>
            <button onClick={exportHta}>Export .HTA</button>
            <button onClick={exportApk}>Export .APK</button>
          </div>

          <div className="status-box">
            <strong>Status</strong>
            <p>{status}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
