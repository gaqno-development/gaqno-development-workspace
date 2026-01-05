import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../index'

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    
    const button = screen.getByText('Click me')
    expect(button).toBeDisabled()
  })

  it('should show loading state', () => {
    render(<Button loading>Click me</Button>)
    
    const button = screen.getByText('Click me')
    expect(button).toBeDisabled()
  })

  it('should have correct aria attributes', () => {
    render(
      <Button aria-label="Submit form" aria-describedby="form-description">
        Submit
      </Button>
    )
    
    const button = screen.getByText('Submit')
    expect(button).toHaveAttribute('aria-label', 'Submit form')
    expect(button).toHaveAttribute('aria-describedby', 'form-description')
  })

  it('should handle keyboard navigation', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByText('Click me')
    fireEvent.keyDown(button, { key: 'Enter' })
    
    expect(handleClick).not.toHaveBeenCalled()
  })
})

