from sys import argv, stdout, stderr, platform
from os import environ
from pathlib import Path
from time import sleep
from subprocess import Popen
from typing import Union, Optional
from argparse import ArgumentParser
from shutil import which

ROOT = Path(argv[0]).absolute().parent


def general_popen(
    *cmd: Union[str, Path], cwd: Path = ROOT, env_add: Optional[dict[str, str]] = None
):
    if env_add is None:
        env_add = {}
    new_env = environ.copy()
    new_env.update(env_add)
    return Popen(
        [str(c) for c in cmd], cwd=str(cwd), stdout=stdout, stderr=stderr, env=new_env
    )


def init_database():
    return general_popen("node", ROOT / "dist-server/script/database_init.mjs")


def build_ts():
    tsc = which("tsc")
    assert tsc is not None, "TypeScript compiler not found"
    return general_popen(tsc, "-p", "tsconfig.server.json", cwd=ROOT)


def build_client():
    pnpm = which("pnpm")
    assert pnpm is not None, "PNPM not found"
    return general_popen(pnpm, "run", "build", cwd=ROOT)


def run_pocket_base():
    pnpx = which("pnpx")
    assert pnpx is not None, "PNPX not found"
    all_wait(
        general_popen(
            pnpx,
            "pocketbase-typegen",
            "--db",
            ROOT / "pb_data" / "data.db",
            "--out",
            ROOT / "types" / "pocketbase-types.ts",
        )
    )
    return general_popen(ROOT / "pocketbase.exe", "serve")


def all_wait(*wait_list: Popen[bytes]):
    for p in wait_list:
        code = p.wait()
        if code != 0:
            raise ChildProcessError(f"Process {p.args} exited with code {code}")


def run_express_server(node_env: str = "development"):
    pocket_base = run_pocket_base()
    if node_env == "production":
        build_client().wait()
    build_ts().wait()
    sleep(1)  # To make sure pocket base is ready to serve
    return (
        pocket_base,
        general_popen(
            "node",
            ROOT / "dist-server" / "main.mjs",
            env_add={"NODE_ENV": node_env},
        ),
    )


def run_nginx():
    NGINX = "/usr/sbin/nginx" if platform == 'linux' else which("nginx")
    assert NGINX is not None, "NGINX not found"
    all_wait(general_popen(NGINX, "-s", "stop", cwd=ROOT / "nginx"))
    all_wait(general_popen(NGINX, "-p", ".", "-c", "./conf/nginx.conf", cwd=ROOT / "nginx"))



def main():
    parser = ArgumentParser()
    parser.add_argument(
        "--init-database", action="store_true", help="Initialize the database"
    )
    parser.add_argument(
        "--gen-type",
        action="store_true",
        help="Generate TypeScript types for PocketBase",
    )
    parser.add_argument(
        "--production", "--prod", action="store_true", help="Run in production mode"
    )

    args = parser.parse_args()

    if args.init_database:
        pocket_base = run_pocket_base()
        try:
            build_ts().wait()
            init_database().wait()
        finally:
            pocket_base.terminate()
    elif args.gen_type:
        pocket_base = run_pocket_base()
        pocket_base.terminate()
    else:
        processes = list(run_express_server("production" if args.production else "development"))
        if args.production:
            run_nginx()
        try:
            all_wait(*processes)
        except KeyboardInterrupt:
            pass
        finally:
            for process in processes:
                process.terminate()


if __name__ == "__main__":
    main()
