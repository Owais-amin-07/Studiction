export default function LightBeam() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>

      {/* ── Main wide cone ── */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '0 0 120vh 140vw',
        borderColor: 'transparent transparent rgba(72,207,173,0.015) transparent',
        filter: 'blur(80px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Medium inner cone ── */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '0 0 120vh 90vw',
        borderColor: 'transparent transparent rgba(72,207,173,0.025) transparent',
        filter: 'blur(55px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Tight inner cone ── */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '0 0 120vh 40vw',
        borderColor: 'transparent transparent rgba(72,207,173,0.04) transparent',
        filter: 'blur(35px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Extra tight core cone ── */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '0 0 120vh 15vw',
        borderColor: 'transparent transparent rgba(72,207,173,0.05) transparent',
        filter: 'blur(20px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Sharp top edge ray ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '250vw',
        height: '1.5px',
        background: 'linear-gradient(to left, rgba(255,255,255,0.8) 0%, rgba(72,207,173,0.4) 15%, rgba(72,207,173,0.1) 50%, transparent 100%)',
        transformOrigin: 'bottom right',
        transform: 'rotate(-28deg)',
        filter: 'blur(0.8px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Sharp bottom edge ray ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '250vw',
        height: '1px',
        background: 'linear-gradient(to left, rgba(255,255,255,0.5) 0%, rgba(72,207,173,0.2) 20%, rgba(72,207,173,0.05) 60%, transparent 100%)',
        transformOrigin: 'bottom right',
        transform: 'rotate(-52deg)',
        filter: 'blur(0.5px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Tiny bright entry hole ── */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(72,207,173,0.5) 35%, rgba(72,207,173,0.1) 65%, transparent 85%)',
        filter: 'blur(12px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Scatter glow top-left wall ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '25%',
        height: '30%',
        background: 'radial-gradient(ellipse at top left, rgba(8, 149, 209, 0.42) 0%, transparent 70%)',
        filter: 'blur(80px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Extra depth glow along beam center ── */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '0 0 80vh 25vw',
        borderColor: 'transparent transparent rgba(17, 175, 243, 0.03) transparent',
        filter: 'blur(25px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Lens flare dot ── */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        right: '40px',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.85)',
        filter: 'blur(2px)',
        mixBlendMode: 'screen',
      }} />

      {/* ── Lens flare streak ── */}
      <div style={{
        position: 'absolute',
        bottom: '62px',
        right: '30px',
        width: '60px',
        height: '1px',
        background: 'linear-gradient(to left, rgba(255,255,255,0.5) 0%, transparent 100%)',
        filter: 'blur(1px)',
        mixBlendMode: 'screen',
      }} />

    </div>
  );
}