import { Icon } from '../icon/icon';
import styles from './button.module.css';
import { classes } from '~/utils/style';

interface ButtonProps {
  iconId: string;
  isActive?: boolean;
  onClick?: () => void;
  ariaLabel: string;
  title?: string;
}

export const Button = ({ 
  iconId, 
  isActive = false, 
  onClick,
  ariaLabel,
  title 
}: ButtonProps) => {
  return (
    <button
      className={classes(styles.button, isActive && styles.active)}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      title={title || ariaLabel}
    >
      <Icon
        size={30}        
        icon={iconId} 
        className={styles.icon}
      />
    </button>
  );
};

Button.displayName = 'Button';