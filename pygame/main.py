import pygame
import sys
import os


worldx = 960
worldy = 720

fps = 40
ani = 4

clock = pygame.time.Clock()
pygame.init()

world = pygame.display.set_mode([worldx,worldy])
backdrop = pygame.image.load('test.jpg')

backdropbox = world.get_rect()

looping = True

while looping:

    world.blit(backdrop,backdropbox)
    pygame.display.flip()
    clock.tick(fps)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            try:
                sys.exit()
            finally:
                main=False
        if event.type == pygame.KEYDOWN:
            if event.key == ord('q'):
                pygame.quit()
                try:
                    sys.quit()
                finally:
                    main = False

