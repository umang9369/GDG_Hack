resource "docker_container" "backend" {
  name  = "gdg-backend"
  image = docker_image.backend.image_id

  ports {
    internal = 5000
    external = 5000
  }
}

resource "docker_container" "frontend" {
  name  = "gdg-frontend"
  image = docker_image.frontend.image_id

  ports {
    internal = 3000
    external = 3000
  }

  depends_on = [docker_container.backend]
}
