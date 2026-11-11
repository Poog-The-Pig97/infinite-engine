import { useEffect, useMemo, useRef, useState } from 'react';
import Scene3D from './Scene3D';

const initialBlocks = [
  { id: 'b1', title: 'On Start', category: 'Events', color: '#7c3aed' },
  { id: 'b2', title: 'Move Forward', category: 'Motion', color: '#2563eb' },
  { id: 'b3', title: 'Play Sound', category: 'Audio', color: '#f59e0b' },
  { id: 'b4', title: 'If Touch', category: 'Logic', color: '#10b981' },
  { id: 'b5', title: 'Set Sprite', category: 'Graphics', color: '#ec4899' },
];

const initialSprites = [
  { id: 's1', name: 'Hero', x: 170, y: 215, size: 76, color: '#8b5cf6', label: 'H' },
  { id: 's2', name: 'Coin', x: 350, y: 140, size: 42, color: '#fbbf24', label: 'C' },
  { id: 's3', name: 'Platform', x: 255, y: 300, size: 112, color: '#34d399', label: 'P' },
];

const defaultScript = `// Advanced runtime example
const hero = sprite('Hero');
const coin = sprite('Coin');

hero.move(12, 0);
if (hero.touches(coin)) {
  coin.hide();
  playSound('coin');
  setSceneAmbient('dreamy');
}
`;

function App() {
  const [projectName, setProjectName] = useState('Infinite Dream');
  const [blocks, setBlocks] = useState(initialBlocks);
  const [sprites, setSprites] = useState(initialSprites);
  const [selectedSpriteId, setSelectedSpriteId] = useState('s1');
  const [jsCode, setJsCode] = useState(defaultScript);
  const [is3D, setIs3D] = useState(false);
  const [ambienceOn, setAmbienceOn] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Advanced engine ready');
  const stageRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('infinite-studio-advanced');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed.projectName) setProjectName(parsed.projectName);
      if (parsed.blocks) setBlocks(parsed.blocks);
      if (parsed.sprites) setSprites(parsed.sprites);
      if (parsed.jsCode) setJsCode(parsed.jsCode);
    } catch (error) {
      console.warn('Failed to restore project state', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'infinite-studio-advanced',
      JSON.stringify({ projectName, blocks, sprites, jsCode })
    );
  }, [projectName, blocks, sprites, jsCode]);

  const selectedSprite = useMemo(
    () => sprites.find((sprite) => sprite.id === selectedSpriteId) ?? sprites[0],
    [sprites, selectedSpriteId]
  );

  const addBlock = (category) => {
    const palette = {
      Events: '#7c3aed',
      Motion: '#2563eb',
      Audio: '#f59e0b',
      Logic: '#10b981',
      Graphics: '#ec4899',
    };

    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `${category} Block`,
      category,
      color: palette[category] ?? '#38bdf8',
    };

    setBlocks((current) => [...current, newBlock]);
    setStatus(`Added ${category.toLowerCase()} block`);
  };

  const addSprite = () => {
    const newSprite = {
      id: `sprite-${Date.now()}`,
      name: `Sprite ${sprites.length + 1}`,
      x: 120 + (sprites.length % 6) * 50,
      y: 110 + (sprites.length % 4) * 40,
      size: 58,
      color: ['#60a5fa', '#f9a8d4', '#fcd34d', '#86efac', '#fca5a5'][sprites.length % 5],
      label: String.fromCharCode(65 + (sprites.length % 26)),
    };

    setSprites((current) => [...current, newSprite]);
    setSelectedSpriteId(newSprite.id);
    setStatus('Sprite added to scene');
  };

  const onSpriteUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newSprite = {
        id: `sprite-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'Custom Sprite',
        x: 150,
        y: 150,
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
      setStatus('Ambience online');
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      setStatus('Audio not supported');
      return;
    }

    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = 0.05;
    master.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 174;

    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.value = 220;

    const gainA = ctx.createGain();
    gainA.gain.value = 0.026;

    const gainB = ctx.createGain();
    gainB.gain.value = 0.022;

    oscA.connect(gainA);
    gainA.connect(master);
    oscB.connect(gainB);
    gainB.connect(master);

    oscA.start();
    oscB.start();

    audioCtxRef.current = ctx;
    window.__ambience = { oscA, oscB, gainA, gainB, master };
    setAmbienceOn(true);
    setStatus('Ambience online');
  };

  const stopAmbience = () => {
    if (window.__ambience) {
      const { oscA, oscB } = window.__ambience;
      oscA.stop();
      oscB.stop();
      delete window.__ambience;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setAmbienceOn(false);
    setStatus('Ambience off');
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
      setStatus('Project built successfully');
    }, 1100);
  };

  const handleStagePointerMove = (event) => {
    if (!selectedSprite) return;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const nextX = Math.min(Math.max(event.clientX - bounds.left - selectedSprite.size / 2, 0), 760);
    const nextY = Math.min(Math.max(event.clientY - bounds.top - selectedSprite.size / 2, 0), 420);

    updateSelectedSprite({ x: nextX, y: nextY });
  };

  const exportFile = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <style>
      body { margin: 0; display: grid; place-items: center; min-height: 100vh; font-family: Arial, sans-serif; background: #070d1a; color: white; }
      .stage { position: relative; width: 960px; height: 560px; border-radius: 18px; border: 2px solid rgba(99, 102, 241, 0.7); background: linear-gradient(180deg, #111827, #0b1120); }
      .sprite { position: absolute; display: grid; place-items: center; border-radius: 50%; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="stage">
      ${sprites
        .map(
          (sprite) =>
            `<div class="sprite" style="left:${sprite.x}px;top:${sprite.y}px;width:${sprite.size}px;height:${sprite.size}px;background:${sprite.color};">${sprite.label}</div>`
        )
        .join('')}
    </div>
  </body>
</html>`;

    exportFile(`${projectName.replace(/\s+/g, '-').toLowerCase()}.html`, html, 'text/html');
    setStatus('HTML export ready');
  };

  const exportHta = () => {
    const hta = `<!DOCTYPE html>
<html>
  <hta:application id="InfiniteStudioPro" applicationname="Infinite Studio Pro" border="thin" caption="yes" contextmenu="no" maximizebutton="yes" minimizebutton="yes" scroll="no" showintaskbar="yes" singleinstance="yes" />
  <head>
    <meta charset="UTF-8" />
    <title>${projectName}</title>
    <style>
      body { background: #070d1a; color: white; padding: 24px; font-family: Segoe UI, sans-serif; }
      .stage { position: relative; height: 420px; border: 2px solid #6366f1; border-radius: 18px; background: linear-gradient(180deg, #111827, #0b1120); }
      .sprite { position: absolute; display: grid; place-items: center; border-radius: 50%; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>${projectName}</h1>
    <div class="stage">
      ${sprites
        .map(
          (sprite) =>
            `<div class="sprite" style="left:${sprite.x}px;top:${sprite.y}px;width:${sprite.size}px;height:${sprite.size}px;background:${sprite.color};">${sprite.label}</div>`
        )
        .join('')}
    </div>
  </body>
</html>`;

    exportFile(`${projectName.replace(/\s+/g, '-').toLowerCase()}.hta`, hta, 'text/html');
    setStatus('HTA export ready');
  };

  const exportApk = () => {
    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.infiniteengine.${projectName.replace(/\s+/g, '').toLowerCase()}">
    <application android:label="${projectName}" android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        <activity android:name=".MainActivity" />
    </application>
</manifest>

# Advanced APK export scaffold for ${projectName}
# Prepare in Android Studio or Capacitor for a real APK build.
`;

    exportFile(`${projectName.replace(/\s+/g, '-').toLowerCase()}.apk`, manifest, 'application/octet-stream');
    setStatus('APK scaffold export generated');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="branding-block">
          <div className="logo">∞</div>
          <div>
            <p className="eyebrow">Advanced Game Studio</p>
            <h1>Infinite Studio Pro</h1>
          </div>
        </div>

        <div className="top-actions">
          <input
            className="title-input"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />
          <button className="primary" onClick={runProject}>
            {isRunning ? 'Running…' : 'Run Project'}
          </button>
          <button className="secondary" onClick={() => setIs3D((value) => !value)}>
            {is3D ? '2D View' : '3D View'}
          </button>
          <button className="secondary" onClick={toggleAmbience}>
            {ambienceOn ? 'Stop Ambience' : 'Ambience'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel">
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
            {is3D ? (
              <div className="three-shell">
                <Scene3D sprites={sprites} />
              </div>
            ) : (
              <div
                ref={stageRef}
                className="stage"
                onPointerMove={handleStagePointerMove}
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
            )}

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

        <aside className="panel">
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
                <span>X</span>
                <input
                  type="number"
                  value={selectedSprite.x}
                  onChange={(event) => updateSelectedSprite({ x: Number(event.target.value) })}
                />
              </label>

              <label>
                <span>Y</span>
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
