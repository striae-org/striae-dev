import styles from './button.module.css';
import Print from '~/assets/print.svg';
import Number from '~/assets/number.svg';
import Index from '~/assets/index.svg';
import ID from '~/assets/ID.svg';
import Class from '~/assets/class.svg';
import Annotate from '~/assets/annotate.svg';

type ButtonType = 'print' | 'number' | 'index' | 'id' | 'class' | 'annotate';

interface ToolbarButtonProps {
  type: ButtonType;
  isActive?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}

export const ToolbarButton = ({ 
  type, 
  isActive = false, 
  onClick,
  ariaLabel 
}: ToolbarButtonProps) => {
  const icons = {
    print: Print,
    number: Number,
    index: Index,
    id: ID,
    class: Class,
    annotate: Annotate
  };

  const Icon = icons[type];

  return (
    <button
      className={`${styles.button} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      <Icon />
    </button>
  );
};