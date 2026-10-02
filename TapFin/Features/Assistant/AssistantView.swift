import SwiftData
import SwiftUI

struct ChatMessage: Identifiable, Equatable {
    enum Role { case user, fin }

    let id = UUID()
    let role: Role
    let text: String
}

/// Conversa com o Fin. Hoje responde com cálculos locais; a IA de verdade entra via backend.
struct AssistantView: View {
    @Query(sort: \MoneyEntry.date, order: .reverse) private var entries: [MoneyEntry]
    @Query(sort: \Account.createdAt) private var accounts: [Account]
    @Query(sort: \CreditCard.createdAt) private var cards: [CreditCard]
    @AppStorage(SettingsKey.userName) private var userName = ""

    @State private var messages: [ChatMessage] = []
    @State private var draft = ""
    @State private var isThinking = false
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        intro
                        ForEach(messages) { message in
                            bubble(message).id(message.id)
                        }
                        if isThinking {
                            TypingIndicator().id("typing")
                        }
                    }
                    .padding(.horizontal, Theme.gutter)
                    .padding(.top, 12)
                    .padding(.bottom, 20)
                }
                .scrollIndicators(.hidden)
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: messages) { _, newValue in
                    if let last = newValue.last {
                        withAnimation(.smooth) { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            if messages.isEmpty {
                suggestions
            }
            inputBar
                .padding(.horizontal, Theme.gutter)
                .padding(.top, 8)
                .padding(.bottom, inputFocused ? 8 : 92)
        }
        .background(Theme.background)
    }

    private var intro: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: "sparkles")
                .font(.title)
                .foregroundStyle(.black)
                .frame(width: 56, height: 56)
                .background(Circle().fill(Theme.lime))
            Text("Oi, \(userName)! Eu sou o Fin.")
                .font(.title2.weight(.bold))
            Text("Pergunte qualquer coisa sobre o seu dinheiro. Eu olho seus lançamentos, faturas e parcelas e te mostro o próximo passo.")
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)
        }
        .padding(.vertical, 20)
    }

    private var suggestions: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(FinAssistant.suggestions, id: \.self) { suggestion in
                    Chip(title: suggestion, isSelected: false) { send(suggestion) }
                }
            }
            .padding(.horizontal, Theme.gutter)
        }
        .scrollIndicators(.hidden)
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Pergunte ao Fin", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .focused($inputFocused)
                .submitLabel(.send)
                .onSubmit { send(draft) }
            Button {
                send(draft)
            } label: {
                Image(systemName: "arrow.up")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(draft.trimmed.isEmpty ? Theme.textTertiary : Theme.lime))
            }
            .disabled(draft.trimmed.isEmpty)
        }
        .padding(.leading, 18)
        .padding(.trailing, 6)
        .padding(.vertical, 6)
        .background(Capsule().fill(Theme.card))
        .overlay(Capsule().strokeBorder(Theme.cardStroke, lineWidth: 1))
    }

    private func bubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.role == .user { Spacer(minLength: 50) }
            Text(message.text)
                .font(.body)
                .foregroundStyle(message.role == .user ? .black : .white)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(message.role == .user ? Theme.lime : Theme.card)
                )
            if message.role == .fin { Spacer(minLength: 50) }
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private func send(_ text: String) {
        let question = text.trimmed
        guard !question.isEmpty, !isThinking else { return }
        draft = ""
        withAnimation(.smooth) {
            messages.append(ChatMessage(role: .user, text: question))
            isThinking = true
        }
        let reply = FinAssistant.answer(question, entries: entries, accounts: accounts, cards: cards)
        Task {
            try? await Task.sleep(for: .milliseconds(650))
            withAnimation(.smooth) {
                isThinking = false
                messages.append(ChatMessage(role: .fin, text: reply))
            }
        }
    }
}

private struct TypingIndicator: View {
    var body: some View {
        Image(systemName: "ellipsis")
            .font(.title3.weight(.bold))
            .foregroundStyle(Theme.textSecondary)
            .symbolEffect(.variableColor.iterative, options: .repeating)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Theme.card))
    }
}
