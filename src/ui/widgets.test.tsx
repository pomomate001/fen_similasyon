import { act, render, screen } from '@testing-library/react';
import { Feedback, FEEDBACK_MS } from './widgets';

describe('Feedback bilgi kartı', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('kısa süre görünür, sonra ekrandan tamamen kalkar', () => {
    render(<Feedback kind="hint">İpucu</Feedback>);
    expect(screen.getByTestId('feedback-hint')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(FEEDBACK_MS + 100));
    expect(screen.getByTestId('feedback-hint')).toHaveClass('leaving');
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByTestId('feedback-hint')).toBeNull();
  });

  it('aynı metinle yeni bir geri bildirim gelince yeniden belirir', () => {
    const t1 = {};
    const { rerender } = render(<Feedback kind="hint" token={t1}>Tekrar deneyelim.</Feedback>);
    act(() => vi.advanceTimersByTime(FEEDBACK_MS + 600));
    expect(screen.queryByTestId('feedback-hint')).toBeNull();
    rerender(<Feedback kind="hint" token={{}}>Tekrar deneyelim.</Feedback>);
    expect(screen.getByTestId('feedback-hint')).toBeInTheDocument();
  });
});
