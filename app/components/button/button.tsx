import { Icon } from '../icon/icon';
import styles from './button.module.css';
import { classes } from '~/utils/style';

interface ButtonProps {
  iconId: string;
  isActive?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}

export const Button = ({ 
  iconId, 
  isActive = false, 
  onClick,
  ariaLabel 
}: ButtonProps) => {
  return (
    <button
      className={classes(styles.button, isActive && styles.active)}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      <Icon
        width={50}
        height={50} 
        icon={iconId} 
        className={styles.icon}
      />
    </button>
  );
};

Button.displayName = 'Button';