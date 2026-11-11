import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditableName } from './EditableName'

describe('EditableName', () => {
  it('guarda el nombre limpio al presionar Enter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<EditableName name="Scan 1" onSave={onSave} />)

    await userEvent.click(screen.getByTitle('Renombrar'))
    const input = screen.getByLabelText('Nombre del documento')
    await userEvent.clear(input)
    await userEvent.type(input, 'Factura/Luz{Enter}')

    expect(onSave).toHaveBeenCalledWith('FacturaLuz')
  })

  it('no guarda si se cancela con Escape', async () => {
    const onSave = vi.fn()
    render(<EditableName name="Scan 1" onSave={onSave} />)

    await userEvent.click(screen.getByTitle('Renombrar'))
    await userEvent.type(screen.getByLabelText('Nombre del documento'), 'xx{Escape}')

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByTitle('Renombrar')).toHaveTextContent('Scan 1')
  })
})
