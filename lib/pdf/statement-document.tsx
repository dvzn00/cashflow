import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { BudgetWithCategory, TransactionWithCategory } from "@/lib/actions/types";
import type { MonthlyTotals } from "@/lib/domain/calculations";
import { formatDateBR, formatMonthLabel } from "@/lib/domain/date";
import { formatMoney } from "@/lib/domain/money";

/**
 * Print palette. The screen theme is dark by default; on paper the light
 * values are the readable ones, so the statement always uses those.
 */
const ink = "#1a1d2b";
const muted = "#6b728e";
const hairline = "#d1d5db";
const turquoise = "#00a394";
const purple = "#6b46c1";
const danger = "#c02a48";

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: ink,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: turquoise,
    paddingBottom: 10,
  },
  wordmark: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: -0.4 },
  headerCaption: { fontSize: 8, color: muted, marginTop: 3 },
  headerRight: { alignItems: "flex-end" },
  monthLabel: { fontSize: 13, fontFamily: "Helvetica-Bold" },

  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.1,
    color: muted,
    marginTop: 24,
    marginBottom: 8,
  },

  summaryRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: hairline,
    borderRadius: 5,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  summaryLabel: { fontSize: 7.5, color: muted, letterSpacing: 0.8 },
  summaryValue: { fontSize: 15, fontFamily: "Helvetica-Bold", marginTop: 5 },
  summaryFoot: { fontSize: 7.5, color: muted, marginTop: 4 },

  table: { borderTopWidth: 1, borderTopColor: hairline },
  tableHead: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: hairline,
  },
  headCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: muted,
    letterSpacing: 0.7,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e8eaf0",
  },
  rowAlt: { backgroundColor: "#f8f9fc" },

  colDate: { width: 62 },
  colCategory: { width: 108 },
  colDescription: { flex: 1, paddingRight: 8 },
  colAmount: { width: 84, textAlign: "right" },

  swatch: { width: 5, height: 5, borderRadius: 2.5, marginRight: 5 },
  categoryCell: { flexDirection: "row", alignItems: "center" },

  amountIncome: { color: turquoise, fontFamily: "Helvetica-Bold" },
  amountExpense: { color: purple, fontFamily: "Helvetica-Bold" },

  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e8eaf0",
  },
  meterTrack: {
    height: 4,
    backgroundColor: "#e8eaf0",
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 10,
  },
  meterFill: { height: 4, borderRadius: 2 },

  empty: {
    borderWidth: 1,
    borderColor: hairline,
    borderStyle: "dashed",
    borderRadius: 5,
    padding: 20,
    textAlign: "center",
    color: muted,
  },

  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: muted,
    borderTopWidth: 0.5,
    borderTopColor: hairline,
    paddingTop: 7,
  },
});

export interface StatementProps {
  month: string;
  ownerName: string;
  totals: MonthlyTotals;
  transactions: TransactionWithCategory[];
  budgets: BudgetWithCategory[];
  generatedAt: Date;
}

function budgetColor(status: BudgetWithCategory["status"]) {
  if (status === "over") return danger;
  if (status === "warning") return "#b45309";
  return turquoise;
}

export function StatementDocument({
  month,
  ownerName,
  totals,
  transactions,
  budgets,
  generatedAt,
}: StatementProps) {
  const monthLabel = formatMonthLabel(month);
  const savingsRate = `${totals.savingsRate.toFixed(1).replace(".", ",")}%`;

  const generatedLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(generatedAt);

  return (
    <Document
      title={`Cashflow — extrato de ${monthLabel}`}
      author="Cashflow"
      subject={`Extrato mensal de ${ownerName}`}
      language="pt-BR"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.wordmark}>Cashflow</Text>
            <Text style={styles.headerCaption}>Extrato mensal · {ownerName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Text style={styles.headerCaption}>
              {transactions.length}{" "}
              {transactions.length === 1 ? "lançamento" : "lançamentos"}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>RECEITAS</Text>
            <Text style={[styles.summaryValue, { color: turquoise }]}>
              {formatMoney(totals.income)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>DESPESAS</Text>
            <Text style={[styles.summaryValue, { color: purple }]}>
              {formatMoney(totals.expenses)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>SALDO DO MÊS</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totals.balance < 0 ? danger : ink },
              ]}
            >
              {formatMoney(totals.balance)}
            </Text>
            <Text style={styles.summaryFoot}>
              Taxa de economia {savingsRate}
            </Text>
          </View>
        </View>

        {budgets.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>ORÇAMENTOS</Text>
            {budgets.map((budget) => (
              <View key={budget.id} style={styles.budgetRow} wrap={false}>
                <Text style={{ width: 108 }}>
                  {budget.category?.name ?? "Sem categoria"}
                </Text>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${Math.min(100, Math.max(0, budget.percent))}%`,
                        backgroundColor: budgetColor(budget.status),
                      },
                    ]}
                  />
                </View>
                <Text style={{ width: 44, textAlign: "right", color: budgetColor(budget.status) }}>
                  {Math.round(budget.percent)}%
                </Text>
                <Text style={{ width: 150, textAlign: "right", color: muted }}>
                  {formatMoney(budget.spent)} de {formatMoney(budget.limit)}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>LANÇAMENTOS</Text>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Text>Nenhuma transação registrada em {monthLabel}.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHead} fixed>
              <Text style={[styles.headCell, styles.colDate]}>DATA</Text>
              <Text style={[styles.headCell, styles.colCategory]}>CATEGORIA</Text>
              <Text style={[styles.headCell, styles.colDescription]}>DESCRIÇÃO</Text>
              <Text style={[styles.headCell, styles.colAmount]}>VALOR</Text>
            </View>

            {transactions.map((transaction, index) => (
              <View
                key={transaction.id}
                style={[styles.row, ...(index % 2 === 1 ? [styles.rowAlt] : [])]}
                wrap={false}
              >
                <Text style={styles.colDate}>{formatDateBR(transaction.date)}</Text>
                <View style={[styles.colCategory, styles.categoryCell]}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: transaction.category?.color ?? hairline },
                    ]}
                  />
                  <Text>{transaction.category?.name ?? "Sem categoria"}</Text>
                </View>
                <Text style={styles.colDescription}>
                  {transaction.description ?? "—"}
                </Text>
                <Text
                  style={[
                    styles.colAmount,
                    transaction.type === "income"
                      ? styles.amountIncome
                      : styles.amountExpense,
                  ]}
                >
                  {transaction.type === "income" ? "+" : "−"}
                  {formatMoney(transaction.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Gerado em {generatedLabel}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
