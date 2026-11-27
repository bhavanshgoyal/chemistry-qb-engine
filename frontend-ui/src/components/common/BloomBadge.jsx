import { getBloomMeta } from '../../data/syllabus';

const BloomBadge = ({ level, showCode = false }) => {
  const meta = getBloomMeta(level);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${meta.badgeClass}`}
    >
      {showCode && level ? <span className="font-mono opacity-80">{meta.short}</span> : null}
      <span>{meta.label}</span>
    </span>
  );
};

export default BloomBadge;
