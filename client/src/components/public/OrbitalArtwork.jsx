// CSS ambient motion composes with the parent pointer parallax hook.
const OrbitalArtwork = ({ variant = 'hero' }) => (
  <div className={`glow-orbits glow-orbits--${variant}`} aria-hidden="true">
    {['left', 'right'].map(side => <div key={side} className={`glow-orbit-position glow-orbit-position--${side} public-parallax-layer public-parallax-${side === 'left' ? 'medium' : 'strong'}`}>
      <div className="glow-orbit-disc" />
      <div className="glow-orbit-ring"><i /></div>
      <div className="glow-orbit-ring glow-orbit-ring--inner" />
    </div>)}
  </div>
);
export default OrbitalArtwork;
