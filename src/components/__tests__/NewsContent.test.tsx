
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DOMPurify from 'isomorphic-dompurify';
import '@testing-library/jest-dom';

// 테스트할 간단한 컴포넌트를 만듭니다.
const NewsContent = ({ content }: { content: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />;
};

describe('NewsContent Component - XSS Protection', () => {
  it('should remove malicious onerror attribute from img tag', () => {
    const maliciousContent = `<p>Hello <img src="x" onerror="alert('XSS Attack!')"> world</p>`;
    render(<NewsContent content={maliciousContent} />);

    const imgElement = screen.getByRole('img');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).not.toHaveAttribute('onerror');
  });

  it('should keep safe attributes like src', () => {
    const content = `<p>Here is a safe image: <img src="safe-image.jpg"></p>`;
    render(<NewsContent content={content} />);

    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveAttribute('src', 'safe-image.jpg');
  });

  it('should not display script tags', () => {
    const maliciousContent = `<p>Hello<script>alert('hacked')</script></p>`;
    render(<NewsContent content={maliciousContent} />);
    
    const scriptTag = screen.queryByText('script');
    expect(scriptTag).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should sanitize dangerous onclick attributes', () => {
    const maliciousContent = `<button onclick="alert('XSS')">Click me</button>`;
    render(<NewsContent content={maliciousContent} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute('onclick');
  });

  it('should preserve safe HTML structure', () => {
    const safeContent = `<div><h1>Title</h1><p>Safe paragraph with <strong>bold</strong> text.</p></div>`;
    render(<NewsContent content={safeContent} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });
});
