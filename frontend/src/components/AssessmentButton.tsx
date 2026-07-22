import styled from 'styled-components';
import { Lock, Shield, Cpu } from 'lucide-react';
import { useEffect, useRef } from 'react';

const StarSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1"
    style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'auto', fillRule: 'evenodd', clipRule: 'evenodd' }}
    viewBox="0 0 784.11 815.53">
    <g id="Layer_x0020_1">
      <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
    </g>
  </svg>
);

const badges = [
  { icon: Lock,   label: 'Free',       color: '#6c63ff' },
  { icon: Shield, label: 'Private',    color: '#48cfad' },
  { icon: Cpu,    label: 'AI Powered', color: '#a78bfa' },
];

// ── Diagonal Line Canvas ──────────────────────────────────────────
function LineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set size once using parent size
    const parent = canvas.parentElement;
    canvas.width  = parent?.offsetWidth  || 400;
    canvas.height = parent?.offsetHeight || 250;

    const W    = canvas.width;
    const H    = canvas.height;
    const diag = W + H;

    const lines = Array.from({ length: 14 }, (_, i) => ({
      offset: (i / 14) * diag,
      speed:  0.3 + Math.random() * 0.2,
      width:  1.0 + Math.random() * 1.0,
      phase:  Math.random() * Math.PI * 2,
      vibAmp: 2 + Math.random() * 3,
      color:  i % 2 === 0 ? '#6c63ff' : '#48cfad',
      alpha:  0.25 + Math.random() * 0.2,
    }));

    let time   = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      time += 0.008;

      lines.forEach(line => {
        line.offset += line.speed;
        if (line.offset > diag) line.offset = 0;

        const vib = Math.sin(time + line.phase) * line.vibAmp;

        const x1 = line.offset - H + vib;
        const y1 = H;
        const x2 = line.offset + vib;
        const y2 = 0;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0,   'transparent');
        grad.addColorStop(0.2, line.color);
        grad.addColorStop(0.8, line.color);
        grad.addColorStop(1,   'transparent');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = line.alpha;
        ctx.lineWidth   = line.width;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="line-canvas" />;
}

// ── Main Component ────────────────────────────────────────────────
interface AssessmentButtonProps {
  onClick?: () => void;
}

const AssessmentButton = ({ onClick }: AssessmentButtonProps) => {
  return (
    <StyledWrapper>

      <div className="back-panel">
        <LineCanvas />
      </div>

      <div className="glass-board">

        <button onClick={onClick}>
          <span className="btn-text">Begin Your Assessment →</span>
          <div className="star-1"><StarSVG /></div>
          <div className="star-2"><StarSVG /></div>
          <div className="star-3"><StarSVG /></div>
          <div className="star-4"><StarSVG /></div>
          <div className="star-5"><StarSVG /></div>
          <div className="star-6"><StarSVG /></div>
        </button>

        <div className="divider" />

        <div className="badges">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div
                key={i}
                className="badge"
                style={{ '--badge-color': badge.color } as React.CSSProperties}
              >
                <Icon size={14} strokeWidth={1.8} />
                <span>{badge.label}</span>
              </div>
            );
          })}
        </div>

      </div>

    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .back-panel {
    position: absolute;
    margin-top: 60px;
    top: 1; left: 1;
    width: 450px; height: 270px;
    border-radius: 28px;
    overflow: hidden;
    background: rgba(15, 8, 35, 0.27);
    border: 1px solid rgba(108, 99, 255, 0.25);
    box-shadow:
      0 0 10px rgba(107, 99, 255, 0.07),
      0 0 10px rgba(72, 207, 173, 0.02);
    z-index: 0;
  }

  .line-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .glass-board {
    position: relative;
    margin-top: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 32px 40px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    z-index: 1;
  }

  .divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(108, 99, 255, 0.4),
      rgba(72, 207, 173, 0.4),
      transparent
    );
  }

  button {
    position: relative;
    padding: 16px 40px;
    background: linear-gradient(135deg, #6c63ff, #48cfad);
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    border: 2px solid rgba(108, 99, 255, 0.6);
    border-radius: 12px;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    letter-spacing: 0.03em;
    overflow: visible;
    width: 100%;
  }

  .btn-text {
    position: relative;
    z-index: 10;
  }

  .star-1 { position: absolute; top: 20%; left: 20%; width: 25px; height: auto; filter: drop-shadow(0 0 0 #6c63ff); z-index: -1; transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96); opacity: 0; }
  .star-2 { position: absolute; top: 45%; left: 45%; width: 15px; height: auto; filter: drop-shadow(0 0 0 #48cfad); z-index: -1; transition: all 1s cubic-bezier(0, 0.4, 0, 1.01); opacity: 0; }
  .star-3 { position: absolute; top: 40%; left: 40%; width: 5px;  height: auto; filter: drop-shadow(0 0 0 #ffffff); z-index: -1; transition: all 1s cubic-bezier(0, 0.4, 0, 1.01); opacity: 0; }
  .star-4 { position: absolute; top: 20%; left: 40%; width: 8px;  height: auto; filter: drop-shadow(0 0 0 #6c63ff); z-index: -1; transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01); opacity: 0; }
  .star-5 { position: absolute; top: 25%; left: 45%; width: 15px; height: auto; filter: drop-shadow(0 0 0 #48cfad); z-index: -1; transition: all 0.6s cubic-bezier(0, 0.4, 0, 1.01); opacity: 0; }
  .star-6 { position: absolute; top: 5%;  left: 50%; width: 5px;  height: auto; filter: drop-shadow(0 0 0 #ffffff); z-index: -1; transition: all 0.8s ease; opacity: 0; }

  button:hover {
    background: rgba(10, 10, 26, 0.8);
    color: #48cfad;
    border-color: #48cfad;
    box-shadow: 0 0 30px rgba(72, 207, 173, 0.4), 0 0 60px rgba(108, 99, 255, 0.2);
  }

  button:hover .star-1 { top: -80%; left: -30%; width: 25px; filter: drop-shadow(0 0 10px #6c63ff); z-index: 2; opacity: 1; }
  button:hover .star-2 { top: -25%; left: 10%;  width: 15px; filter: drop-shadow(0 0 10px #48cfad); z-index: 2; opacity: 1; }
  button:hover .star-3 { top: 55%;  left: 25%;  width: 5px;  filter: drop-shadow(0 0 10px #ffffff); z-index: 2; opacity: 1; }
  button:hover .star-4 { top: 30%;  left: 80%;  width: 8px;  filter: drop-shadow(0 0 10px #6c63ff); z-index: 2; opacity: 1; }
  button:hover .star-5 { top: 25%;  left: 115%; width: 15px; filter: drop-shadow(0 0 10px #48cfad); z-index: 2; opacity: 1; }
  button:hover .star-6 { top: 5%;   left: 60%;  width: 5px;  filter: drop-shadow(0 0 10px #ffffff); z-index: 2; opacity: 1; }

  .fil0 { fill: #ffffff; }

  .badges {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    color: var(--badge-color);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--badge-color);
    backdrop-filter: blur(10px);
    box-shadow:
      0 0 8px color-mix(in srgb, var(--badge-color) 30%, transparent),
      inset 0 0 8px color-mix(in srgb, var(--badge-color) 10%, transparent);
    transition: all 0.3s ease;
  }

  .badge:hover {
    background: color-mix(in srgb, var(--badge-color) 15%, transparent);
    box-shadow:
      0 0 16px color-mix(in srgb, var(--badge-color) 50%, transparent),
      inset 0 0 12px color-mix(in srgb, var(--badge-color) 20%, transparent);
    transform: translateY(-2px);
  }
`;

export default AssessmentButton;  