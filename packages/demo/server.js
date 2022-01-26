import Fastify from 'fastify'
import Static from 'fastify-static'
import Pov from 'point-of-view'
import ejs from 'ejs'

const fastify = Fastify({
  logger: true,
})

fastify.register(Static, {
  root: new URL('.', import.meta.url).pathname,
})
fastify.register(Pov, {
  engine: {
    ejs,
  },
})

fastify.get('/', (request, reply) => {
  reply.view('index.html.ejs', {
    version: undefined,
  })
})

fastify.listen(8080)
