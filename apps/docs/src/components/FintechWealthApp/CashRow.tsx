import styles from "./fintechWealthApp.module.css";

type CashRowProps = {
  cashEur: number;
  investedEur: number;
  loading: boolean;
  balanceHidden?: boolean;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

const MASKED_BALANCE = "••••••";

export default function CashRow({
  cashEur,
  investedEur,
  loading,
  balanceHidden = false,
}: CashRowProps) {
  const formatValue = (value: number) => {
    if (loading) {
      return "—";
    }
    return balanceHidden ? MASKED_BALANCE : formatCurrency(value);
  };

  return (
    <div className={styles.cashRow} aria-label="Cash and invested breakdown">
      <div className={styles.cashTile}>
        <span className={styles.cashLabel}>Available to invest</span>
        <strong className={styles.cashValue} aria-hidden={balanceHidden}>
          {formatValue(cashEur)}
        </strong>
      </div>
      <div className={styles.cashDivider} aria-hidden />
      <div className={styles.cashTile}>
        <span className={styles.cashLabel}>Invested</span>
        <strong className={styles.cashValue} aria-hidden={balanceHidden}>
          {formatValue(investedEur)}
        </strong>
      </div>
    </div>
  );
}
