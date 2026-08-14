import { useEffect, useRef } from 'react'

function GridBackground() {
  const svgRef = useRef(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const svg = svgRef.current
    let animationId

    const draw = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      svg.innerHTML = ''

      const offset = offsetRef.current % 40
      for (let x = -40 + offset; x < width; x += 40) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', x)
        line.setAttribute('y1', 0)
        line.setAttribute('x2', x)
        line.setAttribute('y2', height)
        line.setAttribute('stroke', 'currentColor')
        line.setAttribute('stroke-width', '1')
        svg.appendChild(line)
      }
      for (let y = 0; y < height; y += 40) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', 0)
        line.setAttribute('y1', y)
        line.setAttribute('x2', width)
        line.setAttribute('y2', y)
        line.setAttribute('stroke', 'currentColor')
        line.setAttribute('stroke-width', '1')
        svg.appendChild(line)
      }

      offsetRef.current += 0.15
      animationId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gray-50 dark:bg-gray-900">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full text-gray-300 dark:text-gray-700 opacity-40"
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 60%)',
        }}
      />
    </div>
  )
}

export default GridBackground