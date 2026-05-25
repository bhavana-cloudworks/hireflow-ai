import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicationsRouter from "./applications";
import dashboardRouter from "./dashboard";
import resumeRouter from "./resume";
import interviewRouter from "./interview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(applicationsRouter);
router.use(dashboardRouter);
router.use(resumeRouter);
router.use(interviewRouter);

export default router;