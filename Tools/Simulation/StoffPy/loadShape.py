from physicsBox import PhysicsBox
from config import config
from geometry_tools import *

def LoadShape(fp):
	b = PhysicsBox(fp)

	for _ in range(0, config()["simulation_steps"]):
		b.simulation_step()
	
	b.filter_expulsed_points()
	p = b.to_plane()
	p.triangulate()
	p.render()

LoadShape("test.json")