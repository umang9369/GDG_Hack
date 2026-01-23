resource "docker_image" "backend" {
  name = "umang9369/gdg-backend:latest"
}

resource "docker_image" "frontend" {
  name = "umang9369/gdg-frontend:latest"
}
