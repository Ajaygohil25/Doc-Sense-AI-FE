import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Home from '../pages/dashboard/Home';

const renderHome = () => render(
  <MemoryRouter>
    <Home />
  </MemoryRouter>
);

describe('Home', () => {
  it('shows a feature-focused dashboard home page in the app design instead of the upload dropzone', () => {
    const { container } = renderHome();

    expect(screen.getByRole('heading', { name: /welcome to doc-sense ai/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /single-document chat/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /project knowledge bases/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /source-grounded answers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upload a pdf/i })).toHaveClass('btn-primary');
    expect(container.querySelector('.dashboard-home')).toBeInTheDocument();
    expect(container.querySelector('.dashboard-hero')).not.toHaveClass('discord-feature-panel');
    expect(container.querySelector('.hero-summary')).toBeInTheDocument();
    expect(container.querySelector('.product-home')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="cohere"]')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="discord"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/drag & drop your pdf file here/i)).not.toBeInTheDocument();
  });

  it('links users to upload, documents, and projects from the landing page', () => {
    renderHome();

    const links = screen.getAllByRole('link');
    const uploadLink = links.find((link) => link.getAttribute('href') === '/upload');
    const documentsLink = links.find((link) => link.getAttribute('href') === '/documents');
    const projectsLink = links.find((link) => link.getAttribute('href') === '/projects');

    expect(uploadLink).toHaveAttribute('href', '/upload');
    expect(documentsLink).toHaveAttribute('href', '/documents');
    expect(projectsLink).toHaveAttribute('href', '/projects');
  });
});
