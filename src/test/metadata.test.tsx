import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetadataList } from '../components/MetadataList';

describe('Generic MetadataList Component', () => {
  it('renders nothing when metadata is empty or null', () => {
    const { container } = render(<MetadataList metadata={{}} />);
    expect(container.firstChild).toBeNull();

    const { container: nullContainer } = render(<MetadataList metadata={null} />);
    expect(nullContainer.firstChild).toBeNull();
  });

  it('renders primitives safely (boolean, number, string, null)', () => {
    render(
      <MetadataList
        metadata={{
          wifi: true,
          capacity: 42,
          notes: 'Standard room',
          optionalField: null,
        }}
      />
    );

    expect(screen.getByText('wifi')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Standard room')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders arrays as tags safely', () => {
    render(
      <MetadataList
        metadata={{
          amenities: ['projector', 'whiteboard', 'ethernet'],
        }}
      />
    );

    expect(screen.getByText('amenities')).toBeInTheDocument();
    expect(screen.getByText('projector')).toBeInTheDocument();
    expect(screen.getByText('whiteboard')).toBeInTheDocument();
    expect(screen.getByText('ethernet')).toBeInTheDocument();
  });

  it('renders nested objects without crashing', () => {
    render(
      <MetadataList
        metadata={{
          equipment: {
            screen: '85 inch',
            hdmi: true,
          },
        }}
      />
    );

    expect(screen.getByText('equipment')).toBeInTheDocument();
    expect(screen.getByText(/85 inch/)).toBeInTheDocument();
  });

  it('truncates extremely long text and expands upon clicking "Show more"', () => {
    const longText =
      'This is a very long descriptive text that exceeds sixty characters easily and should trigger the truncation logic in the metadata component.';

    render(
      <MetadataList
        metadata={{
          longNote: longText,
        }}
      />
    );

    const showMoreButton = screen.getByText('Show more');
    expect(showMoreButton).toBeInTheDocument();

    fireEvent.click(showMoreButton);
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.getByText(longText)).toBeInTheDocument();
  });
});
