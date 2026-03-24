namespace Workout
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var app = builder.Build();

            //app.MapGet("/", () => "Hello World!");

            app.UseDefaultFiles();   // serve index.html by default
            app.UseStaticFiles();    // enable serving static files

            app.Run();
        }
    }
}
